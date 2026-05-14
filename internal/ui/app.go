package ui

import (
	"Rocket-Invo/internal/database"
	"Rocket-Invo/internal/repository"
	"Rocket-Invo/internal/ui/dashboard"
	"Rocket-Invo/internal/ui/inventory"
	"Rocket-Invo/internal/ui/customer"
	"Rocket-Invo/internal/ui/invoice"
	"Rocket-Invo/internal/ui/settings"
	"Rocket-Invo/internal/ui/reports"

	"fyne.io/fyne/v2"
	"fyne.io/fyne/v2/container"
	"fyne.io/fyne/v2/theme"
)

type App struct {
	DB          *database.DB
	ProductRepo *repository.ProductRepo
	CustomerRepo *repository.CustomerRepo
	InvoiceRepo  *repository.InvoiceRepo
	SettingsRepo *repository.SettingsRepo
	Window       fyne.Window
}

func NewApp(db *database.DB, win fyne.Window) *App {
	return &App{
		DB:           db,
		ProductRepo:  repository.NewProductRepo(db),
		CustomerRepo: repository.NewCustomerRepo(db),
		InvoiceRepo:  repository.NewInvoiceRepo(db),
		SettingsRepo: repository.NewSettingsRepo(db),
		Window:       win,
	}
}

func (a *App) BuildUI() fyne.CanvasObject {
	dashScreen := dashboard.NewDashboardScreen(a.ProductRepo, a.InvoiceRepo)
	invScreen := inventory.NewInventoryScreen(a.ProductRepo, a.Window)
	custScreen := customer.NewCustomerScreen(a.CustomerRepo, a.Window)
	invScreen2 := invoice.NewInvoiceScreen(a.InvoiceRepo, a.CustomerRepo, a.ProductRepo, a.SettingsRepo, a.Window)
	settingsScreen := settings.NewSettingsScreen(a.SettingsRepo, a.Window)
	reportsScreen := reports.NewReportsScreen(a.InvoiceRepo, a.ProductRepo)

	tabs := container.NewAppTabs(
		container.NewTabItemWithIcon("Dashboard", theme.HomeIcon(), dashScreen.BuildUI()),
		container.NewTabItemWithIcon("Inventory", theme.StorageIcon(), invScreen.BuildUI()),
		container.NewTabItemWithIcon("Customers", theme.AccountIcon(), custScreen.BuildUI()),
		container.NewTabItemWithIcon("Invoices", theme.DocumentIcon(), invScreen2.BuildUI()),
		container.NewTabItemWithIcon("Reports", theme.HistoryIcon(), reportsScreen.BuildUI()),
		container.NewTabItemWithIcon("Settings", theme.SettingsIcon(), settingsScreen.BuildUI()),
	)

	tabs.SetTabLocation(container.TabLocationLeading)
	return tabs
}
