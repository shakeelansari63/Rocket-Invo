import { Database as SqlJsDatabase } from 'sql.js'
import { get, run } from './query'

const migrations: string[] = [
  `CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    sku TEXT,
    description TEXT,
    type TEXT NOT NULL DEFAULT 'sellable',
    price REAL NOT NULL DEFAULT 0,
    cost REAL NOT NULL DEFAULT 0,
    rental_hourly REAL NOT NULL DEFAULT 0,
    rental_daily REAL NOT NULL DEFAULT 0,
    rental_monthly REAL NOT NULL DEFAULT 0,
    stock_qty INTEGER NOT NULL DEFAULT 0,
    min_stock INTEGER NOT NULL DEFAULT 0,
    category TEXT,
    supplier TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_no TEXT NOT NULL,
    customer_id INTEGER REFERENCES customers(id),
    date TEXT NOT NULL,
    subtotal REAL NOT NULL DEFAULT 0,
    tax_rate REAL NOT NULL DEFAULT 0,
    tax_amount REAL NOT NULL DEFAULT 0,
    discount REAL NOT NULL DEFAULT 0,
    total REAL NOT NULL DEFAULT 0,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'unpaid',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS invoice_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price REAL NOT NULL DEFAULT 0,
    total REAL NOT NULL DEFAULT 0,
    rental_period TEXT
  )`,

  `CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  )`,
]

export function runMigrations(db: SqlJsDatabase): void {
  run(db, `CREATE TABLE IF NOT EXISTS schema_version (version INTEGER PRIMARY KEY)`)

  const row = get<{ v: number }>(db,
    "SELECT COALESCE((SELECT MAX(version) FROM schema_version), 0) AS v")
  let version = row?.v ?? 0

  while (version < migrations.length) {
    run(db, migrations[version])
    version++
    run(db, "INSERT OR REPLACE INTO schema_version (version) VALUES (?)", [version])
  }

  const countResult = get<{ count: number }>(db,
    "SELECT COUNT(*) as count FROM settings")
  if (countResult?.count === 0) {
    const seedSettings: [string, string][] = [
      ['business_name', 'My Business'],
      ['business_address', ''],
      ['business_phone', ''],
      ['business_email', ''],
      ['tax_rate', '10'],
      ['currency', 'INR'],
      ['invoice_prefix', 'INV-'],
      ['next_number', '1'],
    ]
    for (const [key, value] of seedSettings) {
      run(db, "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)", [key, value])
    }
  }
}
