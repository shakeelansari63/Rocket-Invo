package reports

import (
	"fmt"
	"Rocket-Invo/internal/repository"

	"fyne.io/fyne/v2"
	"fyne.io/fyne/v2/container"
	"fyne.io/fyne/v2/widget"
)

type ReportsScreen struct {
	invoiceRepo *repository.InvoiceRepo
	productRepo *repository.ProductRepo
}

func NewReportsScreen(ir *repository.InvoiceRepo, pr *repository.ProductRepo) *ReportsScreen {
	return &ReportsScreen{
		invoiceRepo: ir,
		productRepo: pr,
	}
}

func (s *ReportsScreen) BuildUI() fyne.CanvasObject {
	invoices, _ := s.invoiceRepo.GetAll()
	products, _ := s.productRepo.GetAll()

	totalSales := 0.0
	totalPaid := 0.0
	totalUnpaid := 0.0
	for _, inv := range invoices {
		totalSales += inv.Total
		if inv.Status == "paid" {
			totalPaid += inv.Total
		} else if inv.Status == "unpaid" {
			totalUnpaid += inv.Total
		}
	}

	totalStock := 0
	totalValue := 0.0
	for _, p := range products {
		totalStock += p.StockQty
		totalValue += float64(p.StockQty) * p.Cost
	}

	return container.NewScroll(container.NewVBox(
		widget.NewLabelWithStyle("Reports", fyne.TextAlignLeading, fyne.TextStyle{Bold: true}),
		widget.NewSeparator(),
		widget.NewLabelWithStyle("Sales Summary", fyne.TextAlignLeading, fyne.TextStyle{Bold: true}),
		widget.NewLabel(fmt.Sprintf("Total Invoices: %d", len(invoices))),
		widget.NewLabel(fmt.Sprintf("Total Sales: ₹%.2f", totalSales)),
		widget.NewLabel(fmt.Sprintf("Total Paid: ₹%.2f", totalPaid)),
		widget.NewLabel(fmt.Sprintf("Total Unpaid: ₹%.2f", totalUnpaid)),
		widget.NewSeparator(),
		widget.NewLabelWithStyle("Inventory Summary", fyne.TextAlignLeading, fyne.TextStyle{Bold: true}),
		widget.NewLabel(fmt.Sprintf("Total Products: %d", len(products))),
		widget.NewLabel(fmt.Sprintf("Total Stock Units: %d", totalStock)),
		widget.NewLabel(fmt.Sprintf("Inventory Value (by Cost): ₹%.2f", totalValue)),
	))
}
