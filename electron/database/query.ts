import { Database as SqlJsDatabase } from 'sql.js'

export function all<T>(db: SqlJsDatabase, sql: string, params: any[] = []): T[] {
  const stmt = db.prepare(sql)
  if (params.length > 0) stmt.bind(params)
  const results: T[] = []
  while (stmt.step()) {
    results.push(stmt.getAsObject() as T)
  }
  stmt.free()
  return results
}

export function get<T>(db: SqlJsDatabase, sql: string, params: any[] = []): T | undefined {
  const results = all<T>(db, sql, params)
  return results.length > 0 ? results[0] : undefined
}

export function run(db: SqlJsDatabase, sql: string, params: any[] = []): void {
  db.run(sql, params)
}

export function lastInsertId(db: SqlJsDatabase): number {
  const result = get<{ id: number }>(db, "SELECT last_insert_rowid() AS id")
  return result?.id || 0
}
