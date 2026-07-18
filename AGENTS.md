# Rocket Invo — Project Guide

## Overview

Rocket Invo is a cross-platform desktop invoicing application for small businesses. It uses Electron for the desktop shell, React + TypeScript + Ant Design for the UI, and SQLite (sql.js) for data persistence.

## Architecture

### Two-Process Model

- **Main Process** (`electron/`): Node.js/TypeScript — handles window management, IPC, and all database operations
- **Renderer Process** (`src/`): React/TypeScript — UI rendered via Vite, communicates with main process through `window.api` (Electron contextBridge)

### Data Flow

```
Renderer (React)
  ↓ window.api.* (IPC invoke)
Preload (contextBridge)
  ↓ ipcMain.handle
Main Process IPC Handler
  ↓
Repository Layer → SQLite (sql.js)
```

### Key Directories

| Directory | Purpose |
|-----------|---------|
| `electron/database/` | SQLite connection, migrations, query helpers, and CRUD repositories |
| `electron/ipc-handlers.ts` | All IPC handlers mapped to repository methods |
| `src/components/` | React page components (one per tab) |

## Database Schema

Tables: `schema_version`, `products`, `customers`, `invoices`, `invoice_items`, `settings`

Products support two types:
- **sellable** — has price/cost, deducts stock on invoice
- **rentable** — has hourly/daily/monthly rates, no stock deduction

Invoices have three statuses: `unpaid`, `paid`, `cancelled`

## API Surface (window.api)

All methods return Promises.

### Dashboard
- `getDashboardStats()` → `{ totalProducts, totalInvoices, lowStockCount, recentInvoices[], lowStockProducts[] }`

### Customers
- `customers.getAll()`, `getById()`, `create()`, `update()`, `delete()`

### Products
- `products.getAll()`, `getById()`, `create()`, `update()`, `delete()`, `search(query)`, `getLowStock()`

### Invoices
- `invoices.getAll()`, `getById()`, `create()`, `updateStatus()`, `delete()`

### Settings
- `settings.getAll()`, `set(key, value)`

### Reports
- `getReport()` → `{ salesSummary, inventorySummary }`

## Conventions

- **TypeScript only** — never use plain JavaScript in the project
- **No `any`** — all types must be explicitly defined; use `unknown` with proper type guards when necessary
- **Strict TypeScript** — the `strict: true` flag is enabled
- **Database queries** use the helper module `query.ts` (`all`, `get`, `run`, `lastInsertId`) — never use raw `db.prepare`/`stmt` outside of query.ts
- **IPC handlers** must call `saveDb()` after any write operation (create/update/delete)
- **Frontend types** mirror backend types in `src/types.ts` with the global `Window.api` declaration
- **Components** follow functional React with hooks pattern; each major view is a single component file

## Build & Run

```bash
npm run build:electron   # Compile electron/ TypeScript → electron-dist/
npm run electron:dev     # Dev mode with HMR
npm run electron:build   # Production build + package
```
