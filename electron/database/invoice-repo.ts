import { Database as SqlJsDatabase } from 'sql.js'
import { Invoice, InvoiceItem, InvoiceStatus } from '../types'
import { all, get, run, lastInsertId } from './query'
import { SettingsRepo } from './settings-repo'

export class InvoiceRepo {
  private db: SqlJsDatabase
  private settingsRepo: SettingsRepo

  constructor(db: SqlJsDatabase) {
    this.db = db
    this.settingsRepo = new SettingsRepo(db)
  }

  getAll(): Invoice[] {
    return all<Invoice>(this.db,
      `SELECT i.*, c.name as customer_name
       FROM invoices i LEFT JOIN customers c ON i.customer_id = c.id
       ORDER BY i.created_at DESC`)
  }

  getById(id: number): Invoice | undefined {
    const invoice = get<Invoice>(this.db,
      `SELECT i.*, c.name as customer_name
       FROM invoices i LEFT JOIN customers c ON i.customer_id = c.id
       WHERE i.id = ?`, [id])
    if (!invoice) return undefined
    invoice.items = all<InvoiceItem>(this.db,
      'SELECT * FROM invoice_items WHERE invoice_id = ?', [id])
    return invoice
  }

  create(data: {
    customer_id: number | null
    date: string
    subtotal: number
    tax_rate: number
    tax_amount: number
    discount: number
    total: number
    notes: string
    items: Omit<InvoiceItem, 'id' | 'invoice_id'>[]
  }): number {
    const prefix = this.settingsRepo.get('invoice_prefix') || 'INV-'
    const nextNum = parseInt(this.settingsRepo.get('next_number') || '1', 10)
    const invoiceNo = `${prefix}${nextNum}`

    this.db.exec('BEGIN TRANSACTION')
    try {
      run(this.db,
        `INSERT INTO invoices (invoice_no, customer_id, date, subtotal, tax_rate, tax_amount, discount, total, notes, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'unpaid')`,
        [invoiceNo, data.customer_id, data.date, data.subtotal, data.tax_rate,
         data.tax_amount, data.discount, data.total, data.notes])

      const invoiceId = lastInsertId(this.db)

      for (const item of data.items) {
        run(this.db,
          `INSERT INTO invoice_items (invoice_id, product_id, product_name, quantity, unit_price, total, rental_period)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [invoiceId, item.product_id, item.product_name, item.quantity,
           item.unit_price, item.total, item.rental_period])

        if (item.product_id && !item.rental_period) {
          run(this.db, 'UPDATE products SET stock_qty = stock_qty - ? WHERE id = ?',
            [item.quantity, item.product_id])
        }
      }

      this.settingsRepo.set('next_number', String(nextNum + 1))
      this.db.exec('COMMIT')
      return invoiceId
    } catch (e) {
      this.db.exec('ROLLBACK')
      throw e
    }
  }

  updateStatus(id: number, status: InvoiceStatus): void {
    run(this.db, 'UPDATE invoices SET status = ? WHERE id = ?', [status, id])
  }

  delete(id: number): void {
    run(this.db, 'DELETE FROM invoices WHERE id = ?', [id])
  }

  getRecent(limit: number = 5): Invoice[] {
    return all<Invoice>(this.db,
      `SELECT i.*, c.name as customer_name
       FROM invoices i LEFT JOIN customers c ON i.customer_id = c.id
       ORDER BY i.created_at DESC LIMIT ?`, [limit])
  }

  getStats(): { total: number; totalSales: number; totalPaid: number; totalUnpaid: number } {
    const result = get<{ total: number; totalSales: number; totalPaid: number; totalUnpaid: number }>(this.db,
      `SELECT
        COUNT(*) as total,
        COALESCE(SUM(total), 0) as totalSales,
        COALESCE(SUM(CASE WHEN status = 'paid' THEN total ELSE 0 END), 0) as totalPaid,
        COALESCE(SUM(CASE WHEN status = 'unpaid' THEN total ELSE 0 END), 0) as totalUnpaid
       FROM invoices`)
    return result || { total: 0, totalSales: 0, totalPaid: 0, totalUnpaid: 0 }
  }
}
