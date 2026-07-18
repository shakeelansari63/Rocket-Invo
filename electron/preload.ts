import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  getDashboardStats: () => ipcRenderer.invoke('db:getDashboardStats'),
  getReport: () => ipcRenderer.invoke('db:getReport'),

  customers: {
    getAll: () => ipcRenderer.invoke('customers:getAll'),
    getById: (id: number) => ipcRenderer.invoke('customers:getById', id),
    create: (data: any) => ipcRenderer.invoke('customers:create', data),
    update: (data: any) => ipcRenderer.invoke('customers:update', data),
    delete: (id: number) => ipcRenderer.invoke('customers:delete', id),
  },

  products: {
    getAll: () => ipcRenderer.invoke('products:getAll'),
    getById: (id: number) => ipcRenderer.invoke('products:getById', id),
    create: (data: any) => ipcRenderer.invoke('products:create', data),
    update: (data: any) => ipcRenderer.invoke('products:update', data),
    delete: (id: number) => ipcRenderer.invoke('products:delete', id),
    search: (query: string) => ipcRenderer.invoke('products:search', query),
    getLowStock: () => ipcRenderer.invoke('products:getLowStock'),
  },

  invoices: {
    getAll: () => ipcRenderer.invoke('invoices:getAll'),
    getById: (id: number) => ipcRenderer.invoke('invoices:getById', id),
    create: (data: any) => ipcRenderer.invoke('invoices:create', data),
    updateStatus: (id: number, status: string) => ipcRenderer.invoke('invoices:updateStatus', id, status),
    delete: (id: number) => ipcRenderer.invoke('invoices:delete', id),
  },

  settings: {
    getAll: () => ipcRenderer.invoke('settings:getAll'),
    set: (key: string, value: string) => ipcRenderer.invoke('settings:set', key, value),
  },
})
