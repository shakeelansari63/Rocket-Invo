package dashboard

import (
	"fmt"
	"Rocket-Invo/internal/repository"

	"fyne.io/fyne/v2"
	"fyne.io/fyne/v2/canvas"
	"fyne.io/fyne/v2/container"
	"fyne.io/fyne/v2/theme"
	"fyne.io/fyne/v2/widget"
	"image/color"
)

type DashboardScreen struct {
	productRepo *repository.ProductRepo
	invoiceRepo *repository.InvoiceRepo
}

func NewDashboardScreen(pr *repository.ProductRepo, ir *repository.InvoiceRepo) *DashboardScreen {
	return &DashboardScreen{
		productRepo: pr,
		invoiceRepo: ir,
	}
}

func (s *DashboardScreen) BuildUI() fyne.CanvasObject {
	return s.buildContent()
}

func (s *DashboardScreen) buildContent() fyne.CanvasObject {
	totalProducts, _ := s.productRepo.GetAll()
	totalInvoices, _ := s.invoiceRepo.GetAll()
	lowStock, _ := s.productRepo.GetLowStock()

	stats := container.NewGridWithColumns(3,
		s.statCard("Total Products", fmt.Sprintf("%d", len(totalProducts)), theme.StorageIcon(), color.NRGBA{100, 200, 100, 255}),
		s.statCard("Total Invoices", fmt.Sprintf("%d", len(totalInvoices)), theme.DocumentIcon(), color.NRGBA{100, 150, 255, 255}),
		s.statCard("Low Stock", fmt.Sprintf("%d", len(lowStock)), theme.WarningIcon(), color.NRGBA{255, 180, 50, 255}),
	)

	recentLabel := widget.NewLabelWithStyle("Recent Invoices", fyne.TextAlignLeading, fyne.TextStyle{Bold: true})
	lowStockLabel := widget.NewLabelWithStyle("Low Stock Alerts", fyne.TextAlignLeading, fyne.TextStyle{Bold: true})

	recentList := widget.NewList(
		func() int {
			if len(totalInvoices) > 5 {
				return 5
			}
			return len(totalInvoices)
		},
		func() fyne.CanvasObject {
			return container.NewGridWithColumns(3,
				widget.NewLabel(""),
				widget.NewLabel(""),
				widget.NewLabel(""),
			)
		},
		func(id widget.ListItemID, item fyne.CanvasObject) {
			idx := len(totalInvoices) - 1 - id
			inv := totalInvoices[idx]
			grid := item.(*fyne.Container)
			grid.Objects[0].(*widget.Label).SetText(inv.InvoiceNo)
			grid.Objects[1].(*widget.Label).SetText(fmt.Sprintf("₹%.2f", inv.Total))
			grid.Objects[2].(*widget.Label).SetText(string(inv.Status))
		},
	)

	lowStockList := widget.NewList(
		func() int { return len(lowStock) },
		func() fyne.CanvasObject {
			return container.NewGridWithColumns(2,
				widget.NewLabel(""),
				widget.NewLabel(""),
			)
		},
		func(id widget.ListItemID, item fyne.CanvasObject) {
			p := lowStock[id]
			grid := item.(*fyne.Container)
			grid.Objects[0].(*widget.Label).SetText(p.Name)
			grid.Objects[1].(*widget.Label).SetText(fmt.Sprintf("Stock: %d / Min: %d", p.StockQty, p.MinStock))
		},
	)

	return container.NewScroll(container.NewVBox(
		widget.NewLabelWithStyle("Dashboard", fyne.TextAlignLeading, fyne.TextStyle{Bold: true}),
		stats,
		widget.NewSeparator(),
		recentLabel,
		recentList,
		widget.NewSeparator(),
		lowStockLabel,
		lowStockList,
	))
}

func (s *DashboardScreen) statCard(title, value string, icon fyne.Resource, bg color.Color) fyne.CanvasObject {
	rect := canvas.NewRectangle(bg)
	rect.SetMinSize(fyne.NewSize(200, 100))

	return container.NewStack(
		rect,
		container.NewCenter(
			container.NewVBox(
				widget.NewIcon(icon),
				widget.NewLabelWithStyle(value, fyne.TextAlignCenter, fyne.TextStyle{Bold: true}),
				widget.NewLabel(title),
			),
		),
	)
}
