import type { SessionSummary } from '../../shared/session-types'
import { withReadOnlyDb, withReadWriteDb } from './db'

const SELECT_SESSIONS = `
  SELECT s.id, s.title, s.directory, s.time_created, s.time_updated, s.time_archived,
         (SELECT COUNT(*) FROM session_message m WHERE m.session_id = s.id) AS message_count
  FROM session_v2 s
  WHERE s.parent_id IS NULL
  ORDER BY s.time_updated DESC, s.id DESC
`

// parent_id 无外键 CASCADE，需用递归 CTE 手动收集自身与所有子孙。
const DELETE_SESSION_TREE = `
  WITH RECURSIVE descendants AS (
    SELECT id FROM session_v2 WHERE id = ?
    UNION ALL
    SELECT s.id FROM session_v2 s JOIN descendants d ON s.parent_id = d.id
  )
  DELETE FROM session_v2 WHERE id IN (SELECT id FROM descendants)
`

export function listSessions(dbPath: string): SessionSummary[] {
  return withReadOnlyDb(dbPath, (db) =>
    db
      .prepare(SELECT_SESSIONS)
      .all()
      .map((row) => ({
        id: String(row.id),
        title: row.title === null ? null : String(row.title),
        directory: String(row.directory),
        timeCreated: Number(row.time_created),
        timeUpdated: Number(row.time_updated),
        timeArchived: row.time_archived === null ? null : Number(row.time_archived),
        messageCount: Number(row.message_count)
      }))
  )
}

// 只改标题，不动 time_updated，避免越权修改 opencode 的运行时时间戳。
export function renameSession(dbPath: string, id: string, title: string): void {
  withReadWriteDb(dbPath, (db) => {
    db.prepare('UPDATE session_v2 SET title = ? WHERE id = ?').run(title, id)
  })
}

export function deleteSession(dbPath: string, id: string): void {
  withReadWriteDb(dbPath, (db) => {
    db.exec('BEGIN')
    try {
      db.prepare(DELETE_SESSION_TREE).run(id)
      db.exec('COMMIT')
    } catch (error) {
      db.exec('ROLLBACK')
      throw error
    }
  })
}
