export interface Product {
  id: number
  name: string
  sku: string
  description: string
  type: 'sellable' | 'rentable'
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

export interface Settings {
  business_name: string
  business_address: string
  business_phone: string
  business_email: string
  tax_rate: string
  currency: string
  invoice_prefix: string
  next_number: string
}

declare global {
  interface Window {
    api: {
      getDashboardStats: () => Promise<DashboardStats>
      getReport: () => Promise<ReportData>
      customers: {
        getAll: () => Promise<Customer[]>
        getById: (id: number) => Promise<Customer>
        create: (data: Omit<Customer, 'id' | 'created_at'>) => Promise<number>
        update: (data: Customer) => Promise<void>
        delete: (id: number) => Promise<void>
      }
      products: {
        getAll: () => Promise<Product[]>
        getById: (id: number) => Promise<Product>
        create: (data: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => Promise<number>
        update: (data: Product) => Promise<void>
        delete: (id: number) => Promise<void>
        search: (query: string) => Promise<Product[]>
        getLowStock: () => Promise<Product[]>
      }
      invoices: {
        getAll: () => Promise<Invoice[]>
        getById: (id: number) => Promise<Invoice>
        create: (data: any) => Promise<number>
        updateStatus: (id: number, status: string) => Promise<void>
        delete: (id: number) => Promise<void>
      }
      settings: {
        getAll: () => Promise<Settings>
        set: (key: string, value: string) => Promise<void>
      }
    }
  }
}
