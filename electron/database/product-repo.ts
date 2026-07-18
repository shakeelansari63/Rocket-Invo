import { Database as SqlJsDatabase } from 'sql.js'
import { Product } from '../types'
import { all, get, run, lastInsertId } from './query'

export class ProductRepo {
  private db: SqlJsDatabase

  constructor(db: SqlJsDatabase) {
    this.db = db
  }

  getAll(): Product[] {
    return all<Product>(this.db, 'SELECT * FROM products ORDER BY name')
  }

  getById(id: number): Product | undefined {
    return get<Product>(this.db, 'SELECT * FROM products WHERE id = ?', [id])
  }

  create(data: Omit<Product, 'id' | 'created_at' | 'updated_at'>): number {
    run(this.db,
      `INSERT INTO products (name, sku, description, type, price, cost, rental_hourly, rental_daily, rental_monthly, stock_qty, min_stock, category, supplier)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.name, data.sku, data.description, data.type, data.price, data.cost,
       data.rental_hourly, data.rental_daily, data.rental_monthly,
       data.stock_qty, data.min_stock, data.category, data.supplier])
    return lastInsertId(this.db)
  }

  update(data: Product): void {
    run(this.db,
      `UPDATE products SET name = ?, sku = ?, description = ?, type = ?, price = ?, cost = ?,
       rental_hourly = ?, rental_daily = ?, rental_monthly = ?,
       stock_qty = ?, min_stock = ?, category = ?, supplier = ?,
       updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [data.name, data.sku, data.description, data.type, data.price, data.cost,
       data.rental_hourly, data.rental_daily, data.rental_monthly,
       data.stock_qty, data.min_stock, data.category, data.supplier, data.id])
  }

  delete(id: number): void {
    run(this.db, 'DELETE FROM products WHERE id = ?', [id])
  }

  search(query: string): Product[] {
    const like = `%${query}%`
    return all<Product>(this.db,
      'SELECT * FROM products WHERE name LIKE ? OR sku LIKE ? OR category LIKE ? ORDER BY name',
      [like, like, like])
  }

  getLowStock(): Product[] {
    return all<Product>(this.db,
      'SELECT * FROM products WHERE stock_qty <= min_stock AND min_stock > 0 ORDER BY stock_qty')
  }
}
