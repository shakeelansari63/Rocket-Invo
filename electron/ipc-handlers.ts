import { ipcMain } from 'electron'
import { getDb, saveDb } from './database/connection'
import { CustomerRepo } from './database/customer-repo'
import { ProductRepo } from './database/product-repo'
import { InvoiceRepo } from './database/invoice-repo'
import { SettingsRepo } from './database/settings-repo'
import { DashboardStats, ReportData, InvoiceStatus, Customer, Product } from './types'

let customerRepo: CustomerRepo
let productRepo: ProductRepo
let invoiceRepo: InvoiceRepo
let settingsRepo: SettingsRepo

function initRepos(): void {
  const db = getDb()
  customerRepo = new CustomerRepo(db)
  productRepo = new ProductRepo(db)
  invoiceRepo = new InvoiceRepo(db)
  settingsRepo = new SettingsRepo(db)
}

export function registerIpcHandlers(): void {
  initRepos()

  ipcMain.handle('db:getDashboardStats', (): DashboardStats => {
    const totalProducts = productRepo.getAll().length
    const totalInvoices = invoiceRepo.getAll().length
    const lowStockProducts = productRepo.getLowStock()
    const recentInvoices = invoiceRepo.getRecent(5)
    return {
      totalProducts,
      totalInvoices,
      lowStockCount: lowStockProducts.length,
      recentInvoices,
      lowStockProducts,
    }
  })

  ipcMain.handle('db:getReport', (): ReportData => {
    const stats = invoiceRepo.getStats()
    const products = productRepo.getAll()
    const totalProducts = products.length
    const totalStockUnits = products.reduce((s: number, p: Product) => s + p.stock_qty, 0)
    const inventoryValue = products.reduce((s: number, p: Product) => s + p.stock_qty * p.cost, 0)
    return {
      salesSummary: {
        totalInvoices: stats.total,
        totalSales: stats.totalSales,
        totalPaid: stats.totalPaid,
        totalUnpaid: stats.totalUnpaid,
      },
      inventorySummary: { totalProducts, totalStockUnits, inventoryValue },
    }
  })

  ipcMain.handle('customers:getAll', () => customerRepo.getAll())
  ipcMain.handle('customers:getById', (_e: any, id: number) => customerRepo.getById(id))
  ipcMain.handle('customers:create', (_e: any, data: Omit<Customer, 'id' | 'created_at'>) => {
    const id = customerRepo.create(data)
    saveDb()
    return id
  })
  ipcMain.handle('customers:update', (_e: any, data: Customer) => {
    customerRepo.update(data)
    saveDb()
  })
  ipcMain.handle('customers:delete', (_e: any, id: number) => {
    customerRepo.delete(id)
    saveDb()
  })

  ipcMain.handle('products:getAll', () => productRepo.getAll())
  ipcMain.handle('products:getById', (_e: any, id: number) => productRepo.getById(id))
  ipcMain.handle('products:create', (_e: any, data: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => {
    const id = productRepo.create(data)
    saveDb()
    return id
  })
  ipcMain.handle('products:update', (_e: any, data: Product) => {
    productRepo.update(data)
    saveDb()
  })
  ipcMain.handle('products:delete', (_e: any, id: number) => {
    productRepo.delete(id)
    saveDb()
  })
  ipcMain.handle('products:search', (_e: any, query: string) => productRepo.search(query))
  ipcMain.handle('products:getLowStock', () => productRepo.getLowStock())

  ipcMain.handle('invoices:getAll', () => invoiceRepo.getAll())
  ipcMain.handle('invoices:getById', (_e: any, id: number) => invoiceRepo.getById(id))
  ipcMain.handle('invoices:create', (_e: any, data: any) => {
    const id = invoiceRepo.create(data)
    saveDb()
    return id
  })
  ipcMain.handle('invoices:updateStatus', (_e: any, id: number, status: InvoiceStatus) => {
    invoiceRepo.updateStatus(id, status)
    saveDb()
  })
  ipcMain.handle('invoices:delete', (_e: any, id: number) => {
    invoiceRepo.delete(id)
    saveDb()
  })

  ipcMain.handle('settings:getAll', () => settingsRepo.getAll())
  ipcMain.handle('settings:set', (_e: any, key: string, value: string) => {
    settingsRepo.set(key, value)
    saveDb()
  })
}
