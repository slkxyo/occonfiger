import { DatabaseSync } from 'node:sqlite'

// 只读连接：WAL 模式下并发安全，用完立即关闭，不持有长连接。
export function withReadOnlyDb<T>(dbPath: string, fn: (db: DatabaseSync) => T): T {
  const db = new DatabaseSync(dbPath, { readOnly: true })
  try {
    return fn(db)
  } finally {
    db.close()
  }
}

// 读写连接：设置 busy_timeout 避免 opencode 持锁时立即 SQLITE_BUSY；
// 开启外键约束以启用 session_message 的 ON DELETE CASCADE。
export function withReadWriteDb<T>(dbPath: string, fn: (db: DatabaseSync) => T): T {
  const db = new DatabaseSync(dbPath)
  try {
    db.exec('PRAGMA busy_timeout = 5000')
    db.exec('PRAGMA foreign_keys = ON')
    return fn(db)
  } finally {
    db.close()
  }
}
