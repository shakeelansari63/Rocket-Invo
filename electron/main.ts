import { app, BrowserWindow } from 'electron'
import path from 'path'
import fs from 'fs'
import { registerIpcHandlers } from './ipc-handlers'
import { initDb, getDb, closeDb } from './database/connection'
import { runMigrations } from './database/migrations'

let mainWindow: BrowserWindow | null = null

function getIconPath(): string {
  const iconName = process.platform === 'win32' ? 'logo.ico' : 'logo.png'
  const candidates = app.isPackaged
    ? [path.join(process.resourcesPath!, iconName), path.join(__dirname, '..', 'logo.png')]
    : [path.join(__dirname, '..', 'logo.png'), path.join(__dirname, '..', iconName)]
  for (const p of candidates) {
    if (fs.existsSync(p)) return p
  }
  return ''
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1300,
    height: 850,
    minWidth: 1000,
    minHeight: 600,
    title: 'Rocket Invo',
    icon: getIconPath(),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (process.env.NODE_ENV === 'development' || process.argv.includes('--dev')) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(async () => {
  await initDb()
  runMigrations(getDb())
  registerIpcHandlers()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  closeDb()
  if (process.platform !== 'darwin') app.quit()
})
