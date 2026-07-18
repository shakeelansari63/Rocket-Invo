import { Database as SqlJsDatabase } from 'sql.js'
import { get, run, all } from './query'
import { SettingsMap } from '../types'

export class SettingsRepo {
  private db: SqlJsDatabase

  constructor(db: SqlJsDatabase) {
    this.db = db
  }

  get(key: string): string | undefined {
    const row = get<{ value: string }>(this.db, 'SELECT value FROM settings WHERE key = ?', [key])
    return row?.value
  }

  set(key: string, value: string): void {
    run(this.db, 'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, value])
  }

  getAll(): SettingsMap {
    const rows = all<{ key: string; value: string }>(this.db, 'SELECT key, value FROM settings')
    const result: SettingsMap = {}
    for (const row of rows) {
      result[row.key] = row.value
    }
    return result
  }
}
