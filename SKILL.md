# Skills Required for Rocket Invo

## Core Technologies

### Electron
- Understanding of the **main process vs renderer process** architecture
- **Context isolation** and **preload scripts** — all IPC goes through `contextBridge.exposeInMainWorld`
- **IPC communication** — `ipcMain.handle` / `ipcRenderer.invoke` pattern (avoid legacy `send`/`on`)
- **Window management** — `BrowserWindow` configuration, lifecycle events (`ready-to-show`, `closed`)
- **Native modules** — `sql.js` (WASM-based, no native compilation needed)
- **Packaging** — `electron-builder` configuration for Windows (NSIS), macOS (DMG), Linux (AppImage)
- **Dev workflow** — Vite dev server + Electron with `concurrently` and `wait-on`

### TypeScript
- **Strict mode** — `strict: true` in tsconfig
- **No `any`** — always define explicit types; use `unknown` with type guards when the type is truly unknown
- **Type declarations** — declare global types for `window.api` in `src/types.ts`
- **Separate tsconfigs** — one for renderer (`tsconfig.json`, Vite handles it) and one for main process (`tsconfig.electron.json`, compiles with `tsc`)
- **ES modules vs CommonJS** — renderer uses ESM (Vite), main process uses CommonJS (compiled by `tsc`)

### React
- **Functional components with hooks** — `useState`, `useEffect`, `useCallback`
- **Ant Design** — `Table`, `Form`, `Modal`, `Drawer`, `Card`, `Statistic`, `Tag`, `Button`, `Space`, `Popconfirm`, `DatePicker`, `Select`, `Input`, `InputNumber`
- **No class components** — everything uses hooks and functional patterns

### SQLite (sql.js)
- sql.js is **WASM-based and memory-backed** — the entire DB is loaded into memory, modified, then saved to disk via `db.export()`
- **Manual persistence** — call `saveDb()` after every write to write the buffer to disk
- **Query patterns** — use the `query.ts` helper module (`all`, `get`, `run`, `lastInsertId`) instead of raw sql.js API
- **Transactions** — use `db.exec('BEGIN TRANSACTION')` ... `db.exec('COMMIT')` / `db.exec('ROLLBACK')` for multi-step operations
- **sql.js API differences from better-sqlite3**:
  - No `stmt.run()` returning info — use `run()` from query.ts + `lastInsertId()`
  - Must `stmt.free()` after preparing — done automatically in query.ts helpers
  - All parameters are arrays, not variadic

## Project Structure Best Practices

```
project-root/
├── electron/              # Main process source (TypeScript)
│   ├── main.ts            # Entry point — window creation, app lifecycle
│   ├── preload.ts         # Context bridge — exposes window.api
│   ├── ipc-handlers.ts    # All IPC handlers in one file
│   ├── types.ts           # Shared types for main process
│   └── database/          # Data access layer
│       ├── connection.ts  # initDb / getDb / saveDb / closeDb
│       ├── migrations.ts  # Schema versioning & seed data
│       ├── query.ts       # Helper: all(), get(), run(), lastInsertId()
│       ├── customer-repo.ts
│       ├── product-repo.ts
│       ├── invoice-repo.ts
│       └── settings-repo.ts
├── src/                   # Renderer process source (React + Vite)
│   ├── main.tsx           # React entry — ConfigProvider setup
│   ├── App.tsx            # Root layout with sidebar navigation
│   ├── App.css            # Global styles (minimal; Ant Design handles most)
│   ├── types.ts           # Frontend types + window.api type declaration
│   └── components/        # One file per view
│       ├── Dashboard.tsx
│       ├── Inventory.tsx
│       ├── Customers.tsx
│       ├── Invoices.tsx
│       ├── Reports.tsx
│       └── Settings.tsx
├── index.html             # Renderer HTML entry
├── package.json           # main → electron-dist/main.js
├── tsconfig.json          # For IDE support of src/
├── tsconfig.electron.json # Compiles electron/ → electron-dist/ (CommonJS)
└── vite.config.ts         # Vite config with React plugin + @ alias
```

## Key Patterns

### IPC Handler Registration
```typescript
// Always use invoke/handle pattern
ipcMain.handle('resource:action', (_e, arg: Type) => {
  const result = repo.action(arg)
  saveDb() // after any write
  return result
})
```

### Frontend API Call
```typescript
const data = await window.api.customers.getAll()
// Fully typed via global declaration in src/types.ts
```

### Repository Pattern
```typescript
class XRepo {
  constructor(private db: SqlJsDatabase) {}

  getAll(): X[] {
    return all<X>(this.db, 'SELECT * FROM x ORDER BY name')
  }

  create(data: Omit<X, 'id' | 'created_at'>): number {
    run(this.db, 'INSERT INTO x ... VALUES (?)', [data.prop])
    return lastInsertId(this.db)
  }
}
```

### sql.js Persistence
```typescript
// connection.ts handles this — but every IPC write handler must call saveDb()
export function saveDb(): void {
  const data = db!.export()
  fs.writeFileSync(dbPath, Buffer.from(data))
}
```

## Anti-Patterns to Avoid

- ❌ Using `require` in renderer process — never access Node.js APIs from the frontend
- ❌ Using `any` type — prefer `unknown` with type guards, or define an explicit interface
- ❌ Raw `db.prepare`/`stmt` calls outside of `query.ts` — always use the helper module
- ❌ Forgetting `saveDb()` after write operations — data will be lost on restart
- ❌ Mixing JS and TS files in `electron/` — all main process code must be TypeScript
- ❌ Using `send`/`on` IPC — always use `invoke`/`handle` for request-response patterns

## Error Handling

- Wrap IPC handler bodies in try/catch where appropriate
- sql.js throws on SQL errors — let them propagate and log in the handler
- Frontend should show `message.error()` from Ant Design for user-facing errors
- Always use `message.success()` after successful create/update/delete operations
