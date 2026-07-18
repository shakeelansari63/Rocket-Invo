import { Database as SqlJsDatabase } from 'sql.js'
import { Customer } from '../types'
import { all, get, run, lastInsertId } from './query'

export class CustomerRepo {
  private db: SqlJsDatabase

  constructor(db: SqlJsDatabase) {
    this.db = db
  }

  getAll(): Customer[] {
    return all<Customer>(this.db, 'SELECT * FROM customers ORDER BY name')
  }

  getById(id: number): Customer | undefined {
    return get<Customer>(this.db, 'SELECT * FROM customers WHERE id = ?', [id])
  }

  create(data: Omit<Customer, 'id' | 'created_at'>): number {
    run(this.db, 'INSERT INTO customers (name, phone, email, address) VALUES (?, ?, ?, ?)',
      [data.name, data.phone, data.email, data.address])
    return lastInsertId(this.db)
  }

  update(data: Customer): void {
    run(this.db, 'UPDATE customers SET name = ?, phone = ?, email = ?, address = ? WHERE id = ?',
      [data.name, data.phone, data.email, data.address, data.id])
  }

  delete(id: number): void {
    run(this.db, 'DELETE FROM customers WHERE id = ?', [id])
  }
}
