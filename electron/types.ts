export type ProductType = 'sellable' | 'rentable'

export interface Product {
  id: number
  name: string
  sku: string
  description: string
  type: ProductType
  price: number
  cost: number
  rental_hourly: number
  rental_daily: number
  rental_monthly: number
  stock_qty: number
  min_stock: number
  category: string
  supplier: string
  created_at: string
  updated_at: string
}

export interface Customer {
  id: number
  name: string
  phone: string
  email: string
  address: string
  created_at: string
}

export type InvoiceStatus = 'unpaid' | 'paid' | 'cancelled'

export interface InvoiceItem {
  id: number
  invoice_id: number
  product_id: number | null
  product_name: string
  quantity: number
  unit_price: number
  total: number
  rental_period: string
}

export interface Invoice {
  id: number
  invoice_no: string
  customer_id: number | null
  customer_name: string
  date: string
  subtotal: number
  tax_rate: number
  tax_amount: number
  discount: number
  total: number
  notes: string
  status: InvoiceStatus
  created_at: string
  items: InvoiceItem[]
}

export interface SettingsMap {
  [key: string]: string
}

export interface DashboardStats {
  totalProducts: number
  totalInvoices: number
  lowStockCount: number
  recentInvoices: Invoice[]
  lowStockProducts: Product[]
}

export interface ReportData {
  salesSummary: {
    totalInvoices: number
    totalSales: number
    totalPaid: number
    totalUnpaid: number
  }
  inventorySummary: {
    totalProducts: number
    totalStockUnits: number
    inventoryValue: number
  }
}
