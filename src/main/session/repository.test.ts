import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { deleteSession, listSessions, renameSession } from './repository'

let dir: string
let dbPath: string

// 打开一个带外键约束的连接（SQLite 默认不开启，需显式 PRAGMA 才能触发 CASCADE）。
function openDb(): DatabaseSync {
  const db = new DatabaseSync(dbPath)
  db.exec('PRAGMA foreign_keys = ON')
  return db
}

// 建表并写入测试数据：3 个顶层会话（不同 time_updated）、fork 子会话、孙会话、若干消息。
function seedDatabase(): void {
  const db = new DatabaseSync(dbPath)
  db.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE project (id text PRIMARY KEY);
    CREATE TABLE session_v2 (
      id text PRIMARY KEY,
      project_id text NOT NULL REFERENCES project(id) ON DELETE CASCADE,
      parent_id text,
      directory text NOT NULL,
      title text,
      version text NOT NULL,
      time_created integer NOT NULL,
      time_updated integer NOT NULL,
      time_archived integer
    );
    CREATE INDEX session_v2_parent_idx ON session_v2 (parent_id);
    CREATE TABLE session_message (
      id text PRIMARY KEY,
      session_id text NOT NULL REFERENCES session_v2(id) ON DELETE CASCADE,
      type text NOT NULL,
      seq integer NOT NULL,
      time_created integer NOT NULL,
      time_updated integer NOT NULL,
      data text NOT NULL
    );
    INSERT INTO project (id) VALUES ('p1');
    INSERT INTO session_v2 (id, project_id, parent_id, directory, title, version, time_created, time_updated, time_archived) VALUES
      ('s-old', 'p1', NULL, '/work/a', '旧会话', '2', 100, 300, NULL),
      ('s-new', 'p1', NULL, '/work/b', '新会话', '2', 100, 900, NULL),
      ('s-mid', 'p1', NULL, '/work/c', NULL, '2', 100, 500, 700);
    INSERT INTO session_v2 (id, project_id, parent_id, directory, title, version, time_created, time_updated, time_archived) VALUES
      ('s-child', 'p1', 's-new', '/work/b', '子会话', '2', 100, 950, NULL),
      ('s-grand', 'p1', 's-child', '/work/b', '孙会话', '2', 100, 960, NULL);
    INSERT INTO session_message (id, session_id, type, seq, time_created, time_updated, data) VALUES
      ('m1', 's-new', 'user', 1, 100, 100, '{}'),
      ('m2', 's-new', 'assistant', 2, 101, 101, '{"tokens":{"input":100,"cache":{"read":9000,"write":0}}}'),
      ('m6', 's-new', 'assistant', 3, 105, 105, '{"tokens":{"input":200,"cache":{"read":5000,"write":0}}}'),
      ('m3', 's-child', 'user', 1, 102, 102, '{}'),
      ('m4', 's-grand', 'user', 1, 103, 103, '{}'),
      ('m5', 's-old', 'user', 1, 104, 104, '{}');
  `)
  db.close()
}

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'occ-session-'))
  dbPath = join(dir, 'opencode.db')
  seedDatabase()
})

afterEach(() => {
  rmSync(dir, { recursive: true, force: true })
})

describe('listSessions', () => {
  it('只返回顶层会话，排除 fork 子会话，并按更新时间倒序', () => {
    expect(listSessions(dbPath).map((s) => s.id)).toEqual(['s-new', 's-mid', 's-old'])
  })

  it('把 snake_case 列映射为 camelCase 并统计各会话自身消息数', () => {
    const sessions = listSessions(dbPath)
    expect(sessions.find((s) => s.id === 's-new')).toEqual({
      id: 's-new',
      title: '新会话',
      directory: '/work/b',
      timeCreated: 100,
      timeUpdated: 900,
      timeArchived: null,
      messageCount: 3,
      contextSize: 5200
    })
    expect(sessions.find((s) => s.id === 's-mid')).toMatchObject({
      title: null,
      timeArchived: 700,
      messageCount: 0
    })
    expect(sessions.find((s) => s.id === 's-old')).toMatchObject({ messageCount: 1 })
  })

  it('contextSize 取最后一条带 tokens 的 assistant 消息，缺失则为 0', () => {
    const sessions = listSessions(dbPath)
    expect(sessions.find((s) => s.id === 's-new')?.contextSize).toBe(5200)
    expect(sessions.find((s) => s.id === 's-mid')?.contextSize).toBe(0)
    expect(sessions.find((s) => s.id === 's-old')?.contextSize).toBe(0)
  })
})

describe('renameSession', () => {
  it('更新指定会话标题，不影响其他会话，也不改 time_updated', () => {
    renameSession(dbPath, 's-old', '改名了')
    const db = openDb()
    const renamed = db
      .prepare('SELECT title, time_updated FROM session_v2 WHERE id = ?')
      .get('s-old')
    const other = db.prepare('SELECT title FROM session_v2 WHERE id = ?').get('s-new')
    db.close()
    expect(renamed).toMatchObject({ title: '改名了', time_updated: 300 })
    expect(other).toMatchObject({ title: '新会话' })
  })
})

describe('deleteSession', () => {
  it('递归删除自身与所有子孙会话，并级联清空消息', () => {
    deleteSession(dbPath, 's-new')
    const db = openDb()
    const ids = db
      .prepare('SELECT id FROM session_v2 ORDER BY id')
      .all()
      .map((row) => row.id)
    const remainingMessages = db.prepare('SELECT COUNT(*) AS c FROM session_message').get()
    db.close()
    expect(ids).toEqual(['s-mid', 's-old'])
    expect(remainingMessages).toMatchObject({ c: 1 })
  })

  it('删除不存在的会话不报错，也不影响其他数据', () => {
    expect(() => deleteSession(dbPath, 'no-such')).not.toThrow()
    expect(listSessions(dbPath)).toHaveLength(3)
  })
})
