# Rocket Invo

A modern, cross-platform **desktop invoicing & billing application** for small businesses. Built with **Electron**, **React**, **TypeScript**, and **Ant Design**.

## Features

- **Dashboard** — Quick overview with stats (total products, invoices, low stock alerts) and recent activity
- **Inventory Management** — Add/edit/delete products with support for sellable and rentable items, search by name/SKU/category, low stock tracking
- **Customer Management** — Full CRUD for customers with name, phone, email, and address
- **Invoicing** — Create invoices with line items from inventory, auto-generated invoice numbers, tax & discount calculation, rental period support (hourly/daily/monthly), mark as paid
- **Reports** — Sales summary (total invoices, paid vs unpaid) and inventory summary (total units, inventory value)
- **Settings** — Business profile (name, address, phone, email), tax rate, currency symbol, invoice prefix

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop Shell | Electron 33 |
| Frontend | React 19 + TypeScript |
| UI Library | Ant Design 5 |
| Build Tool | Vite 6 |
| Database | SQLite (via sql.js) |
| Charts | Recharts |

## Project Structure

```
rocket-invo/
├── electron/              # Main process (TypeScript)
│   ├── main.ts            # Electron window & lifecycle
│   ├── preload.ts         # Context bridge (IPC API)
│   ├── ipc-handlers.ts    # IPC handler registration
│   ├── types.ts           # Shared type definitions
│   └── database/          # Database layer
│       ├── connection.ts  # SQLite init, save, close
│       ├── migrations.ts  # Schema & seed migrations
│       ├── query.ts       # Helper functions
│       ├── customer-repo.ts
│       ├── product-repo.ts
│       ├── invoice-repo.ts
│       └── settings-repo.ts
├── src/                   # Renderer process (React + Vite)
│   ├── main.tsx           # React entry point
│   ├── App.tsx            # Root layout with sidebar navigation
│   ├── App.css            # Global styles
│   ├── types.ts           # Frontend types & window.api type declarations
│   └── components/
│       ├── Dashboard.tsx
│       ├── Inventory.tsx
│       ├── Customers.tsx
│       ├── Invoices.tsx
│       ├── Reports.tsx
│       └── Settings.tsx
├── index.html             # HTML entry point
├── package.json
├── tsconfig.json          # Renderer tsconfig
├── tsconfig.electron.json # Main process tsconfig
└── vite.config.ts
```

## Getting Started

### Prerequisites

- Node.js 20+
- npm 9+

### Development

```bash
# Install dependencies
npm install

# Build the main process TypeScript
npm run build:electron

# Run in development mode (Vite hot reload + Electron)
npm run electron:dev
```

### Production Build

```bash
# Build and package for current platform
npm run electron:build
```

Output will be in the `release/` directory.

## Database

The app uses **SQLite** via `sql.js` (pure JavaScript/WASM implementation). The database file is stored at:

- **Linux**: `~/.config/rocket-invo/data.db`
- **macOS**: `~/Library/Application Support/rocket-invo/data.db`
- **Windows**: `%APPDATA%/rocket-invo/data.db`

## License

MIT
