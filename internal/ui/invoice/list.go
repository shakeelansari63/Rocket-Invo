package invoice

import (
	"fmt"
	"strconv"
	"strings"
	"time"

	"Rocket-Invo/internal/models"
	"Rocket-Invo/internal/repository"

	"fyne.io/fyne/v2"
	"fyne.io/fyne/v2/container"
	"fyne.io/fyne/v2/dialog"
	"fyne.io/fyne/v2/widget"
)

type lineItem struct {
	product      *models.Product
	quantity     int
	unitPrice    float64
	rentalPeriod string
}

type InvoiceScreen struct {
	invoiceRepo  *repository.InvoiceRepo
	customerRepo *repository.CustomerRepo
	productRepo  *repository.ProductRepo
	settingsRepo *repository.SettingsRepo

	invoices []models.Invoice
	list     *widget.List
	win      fyne.Window
}

func NewInvoiceScreen(
	ir *repository.InvoiceRepo,
	cr *repository.CustomerRepo,
	pr *repository.ProductRepo,
	sr *repository.SettingsRepo,
	win fyne.Window,
) *InvoiceScreen {
	return &InvoiceScreen{
		invoiceRepo:  ir,
		customerRepo: cr,
		productRepo:  pr,
		settingsRepo: sr,
		win:          win,
	}
}

func (s *InvoiceScreen) BuildUI() fyne.CanvasObject {
	s.list = widget.NewList(
		func() int { return len(s.invoices) },
		func() fyne.CanvasObject {
			return container.NewGridWithColumns(5,
				widget.NewLabel(""),
				widget.NewLabel(""),
				widget.NewLabel(""),
				widget.NewLabel(""),
				widget.NewLabel(""),
			)
		},
		func(id widget.ListItemID, item fyne.CanvasObject) {
			inv := s.invoices[id]
			grid := item.(*fyne.Container)
			grid.Objects[0].(*widget.Label).SetText(inv.InvoiceNo)
			grid.Objects[1].(*widget.Label).SetText(inv.Date.Format("02-Jan-2006"))
			grid.Objects[2].(*widget.Label).SetText(fmt.Sprintf("₹%.2f", inv.Total))
			grid.Objects[3].(*widget.Label).SetText(string(inv.Status))
			if inv.Customer != nil {
				grid.Objects[4].(*widget.Label).SetText(inv.Customer.Name)
			}
		},
	)

	s.list.OnSelected = func(id widget.ListItemID) {
		s.showInvoiceDetail(s.invoices[id])
		s.list.Unselect(id)
	}

	toolbar := container.NewHBox(
		widget.NewButton("New Invoice", s.showCreateDialog),
		widget.NewButton("Refresh", s.refresh),
	)

	content := container.NewBorder(toolbar, nil, nil, nil, s.list)
	s.refresh()
	return content
}

func (s *InvoiceScreen) refresh() {
	invoices, err := s.invoiceRepo.GetAll()
	if err != nil {
		return
	}
	for i := range invoices {
		if invoices[i].CustomerID != nil {
			c, err := s.customerRepo.GetByID(*invoices[i].CustomerID)
			if err == nil {
				invoices[i].Customer = c
			}
		}
	}
	s.invoices = invoices
	s.list.Refresh()
}

func (s *InvoiceScreen) showCreateDialog() {
	customers, _ := s.customerRepo.GetAll()
	products, _ := s.productRepo.GetAll()
	settings, _ := s.settingsRepo.GetAll()

	taxRate := 0.0
	if t, ok := settings["tax_rate"]; ok {
		v, _ := strconv.ParseFloat(t, 64)
		taxRate = v
	}
	prefix := settings["invoice_prefix"]
	if prefix == "" {
		prefix = "INV-"
	}

	nextNo, _ := s.invoiceRepo.GetNextInvoiceNo(prefix)

	customerSelect := widget.NewSelect(s.customerNames(customers), nil)
	dateEntry := widget.NewEntry()
	dateEntry.SetText(time.Now().Format("2006-01-02"))
	notesEntry := widget.NewMultiLineEntry()

	var items []lineItem
	itemsLabel := widget.NewLabel("No items added")

	taxEntry := widget.NewEntry()
	taxEntry.SetText(fmt.Sprintf("%.0f", taxRate))
	discountEntry := widget.NewEntry()
	discountEntry.SetText("0")

	totalLabel := widget.NewLabel("Total: ₹0.00")

	updateTotal := func() {
		subtotal := 0.0
		for _, it := range items {
			subtotal += float64(it.quantity) * it.unitPrice
		}
		taxPct, _ := strconv.ParseFloat(taxEntry.Text, 64)
		disc, _ := strconv.ParseFloat(discountEntry.Text, 64)
		taxAmt := subtotal * taxPct / 100
		total := subtotal + taxAmt - disc
		totalLabel.SetText(fmt.Sprintf("Total: ₹%.2f (Sub: ₹%.2f + Tax: ₹%.2f - Disc: ₹%.2f)",
			total, subtotal, taxAmt, disc))
	}

	d := dialog.NewCustomConfirm("New Invoice", "Save", "Cancel",
		container.NewVBox(
			widget.NewForm(
				widget.NewFormItem("Customer", customerSelect),
				widget.NewFormItem("Date (YYYY-MM-DD)", dateEntry),
				widget.NewFormItem("Notes", notesEntry),
			),
			widget.NewButton("Add Item", func() {
				s.showAddItemDialog(products, &items, func() {
					itemsLabel.SetText(fmt.Sprintf("%d items added", len(items)))
					updateTotal()
				})
			}),
			itemsLabel,
			widget.NewForm(
				widget.NewFormItem("Tax Rate (%)", taxEntry),
				widget.NewFormItem("Discount", discountEntry),
			),
			totalLabel,
		),
		func(ok bool) {
			if !ok {
				return
			}
			subtotal := 0.0
			for _, it := range items {
				subtotal += float64(it.quantity) * it.unitPrice
			}
			taxPct, _ := strconv.ParseFloat(taxEntry.Text, 64)
			disc, _ := strconv.ParseFloat(discountEntry.Text, 64)
			taxAmt := subtotal * taxPct / 100
			total := subtotal + taxAmt - disc

			custIdx := customerSelect.SelectedIndex()
			var custID *int64
			if custIdx >= 0 && custIdx < len(customers) {
				custID = &customers[custIdx].ID
			}

			var invoiceItems []models.InvoiceItem
			for _, it := range items {
				t := float64(it.quantity) * it.unitPrice
				pid := it.product.ID
				invoiceItems = append(invoiceItems, models.InvoiceItem{
					ProductID:    &pid,
					ProductName:  it.product.Name,
					Quantity:     it.quantity,
					UnitPrice:    it.unitPrice,
					Total:        t,
					RentalPeriod: it.rentalPeriod,
				})
			}

			inv := &models.Invoice{
				InvoiceNo:  nextNo,
				CustomerID: custID,
				Date:       parseDate(dateEntry.Text),
				Subtotal:   subtotal,
				TaxRate:    taxPct,
				TaxAmount:  taxAmt,
				Discount:   disc,
				Total:      total,
				Notes:      notesEntry.Text,
				Status:     models.StatusUnpaid,
				Items:      invoiceItems,
			}

			_, err := s.invoiceRepo.Create(inv)
			if err != nil {
				dialog.ShowError(err, s.win)
				return
			}
			s.refresh()
		},
		s.win,
	)
	d.Resize(fyne.NewSize(560, 520))
	d.Show()
}

func (s *InvoiceScreen) showAddItemDialog(products []models.Product, items *[]lineItem, onUpdate func()) {
	productNames := make([]string, len(products))
	productMap := make(map[string]*models.Product)
	for i := range products {
		p := &products[i]
		if p.Type == models.ProductSellable {
			productNames[i] = fmt.Sprintf("%s (₹%.2f) [Qty: %d]", p.Name, p.Price, p.StockQty)
		} else {
			productNames[i] = fmt.Sprintf("%s (₹%.2f/hr) [Rentable]", p.Name, p.RentalHourly)
		}
		productMap[productNames[i]] = p
	}

	productSelect := widget.NewSelect(productNames, nil)
	qtyEntry := widget.NewEntry()
	qtyEntry.SetText("1")
	priceEntry := widget.NewEntry()
	periodSelect := widget.NewSelect([]string{"Hourly", "Daily", "Monthly"}, nil)

	periodForm := container.NewVBox()

	productSelect.OnChanged = func(name string) {
		p, ok := productMap[name]
		if !ok {
			return
		}
		periodForm.Objects = nil
		if p.Type == models.ProductRentable {
			periodSelect.SetSelected("Hourly")
			priceEntry.SetText(fmt.Sprintf("%.2f", p.RentalHourly))
			periodForm.Add(widget.NewForm(widget.NewFormItem("Period", periodSelect)))
		} else {
			priceEntry.SetText(fmt.Sprintf("%.2f", p.Price))
		}
		periodForm.Refresh()
	}

	periodSelect.OnChanged = func(period string) {
		p, ok := productMap[productSelect.Selected]
		if !ok {
			return
		}
		switch period {
		case "Hourly":
			priceEntry.SetText(fmt.Sprintf("%.2f", p.RentalHourly))
		case "Daily":
			priceEntry.SetText(fmt.Sprintf("%.2f", p.RentalDaily))
		case "Monthly":
			priceEntry.SetText(fmt.Sprintf("%.2f", p.RentalMonthly))
		}
	}

	content := container.NewVBox(
		widget.NewForm(widget.NewFormItem("Product", productSelect)),
		periodForm,
		widget.NewForm(
			widget.NewFormItem("Quantity", qtyEntry),
			widget.NewFormItem("Unit Price", priceEntry),
		),
	)

	d2 := dialog.NewCustomConfirm("Add Item", "Add", "Cancel", content,
		func(ok bool) {
			if !ok {
				return
			}
			name := productSelect.Selected
			if name == "" {
				return
			}
			p := productMap[name]
			qty, _ := strconv.Atoi(qtyEntry.Text)
			unitPrice, _ := strconv.ParseFloat(priceEntry.Text, 64)
			if qty <= 0 {
				qty = 1
			}

			rentalPeriod := ""
			if p.Type == models.ProductRentable {
				rentalPeriod = periodSelect.Selected
			}

			*items = append(*items, lineItem{
				product:      p,
				quantity:     qty,
				unitPrice:    unitPrice,
				rentalPeriod: rentalPeriod,
			})

			if onUpdate != nil {
				onUpdate()
			}
		},
		s.win,
	)
	d2.Resize(fyne.NewSize(480, 380))
	d2.Show()
}

func (s *InvoiceScreen) showInvoiceDetail(inv models.Invoice) {
	fullInv, err := s.invoiceRepo.GetByID(inv.ID)
	if err != nil {
		dialog.ShowError(err, s.win)
		return
	}

	content := container.NewVBox(
		widget.NewLabelWithStyle("Invoice "+fullInv.InvoiceNo, fyne.TextAlignLeading, fyne.TextStyle{Bold: true}),
		widget.NewLabel(fmt.Sprintf("Date: %s", fullInv.Date.Format("02-Jan-2006"))),
		widget.NewLabel(fmt.Sprintf("Status: %s", fullInv.Status)),
		widget.NewSeparator(),
	)

	if fullInv.Customer != nil {
		content.Add(widget.NewLabel(fmt.Sprintf("Customer: %s", fullInv.Customer.Name)))
	}

	content.Add(widget.NewLabelWithStyle("Items:", fyne.TextAlignLeading, fyne.TextStyle{Bold: true}))
	for _, item := range fullInv.Items {
		if item.RentalPeriod != "" {
			content.Add(widget.NewLabel(fmt.Sprintf("  %s - %s x%d @ ₹%.2f = ₹%.2f",
				item.ProductName, item.RentalPeriod, item.Quantity, item.UnitPrice, item.Total)))
		} else {
			content.Add(widget.NewLabel(fmt.Sprintf("  %s x%d @ ₹%.2f = ₹%.2f",
				item.ProductName, item.Quantity, item.UnitPrice, item.Total)))
		}
	}

	content.Add(widget.NewSeparator())
	content.Add(widget.NewLabel(fmt.Sprintf("Subtotal: ₹%.2f", fullInv.Subtotal)))
	content.Add(widget.NewLabel(fmt.Sprintf("Tax (%.0f%%): ₹%.2f", fullInv.TaxRate, fullInv.TaxAmount)))
	content.Add(widget.NewLabel(fmt.Sprintf("Discount: ₹%.2f", fullInv.Discount)))
	content.Add(widget.NewLabelWithStyle(fmt.Sprintf("Total: ₹%.2f", fullInv.Total),
		fyne.TextAlignLeading, fyne.TextStyle{Bold: true}))

	if fullInv.Notes != "" {
		content.Add(widget.NewSeparator())
		content.Add(widget.NewLabel(fmt.Sprintf("Notes: %s", fullInv.Notes)))
	}

	toolbar := container.NewHBox()
	if fullInv.Status == models.StatusUnpaid {
		toolbar.Add(widget.NewButton("Mark Paid", func() {
			s.invoiceRepo.UpdateStatus(fullInv.ID, models.StatusPaid)
			s.refresh()
		}))
	}
	toolbar.Add(widget.NewButton("Delete", func() {
		dialog.ShowConfirm("Delete Invoice", "Delete "+fullInv.InvoiceNo+"?",
			func(ok bool) {
				if ok {
					s.invoiceRepo.Delete(fullInv.ID)
					s.refresh()
				}
			}, s.win)
	}))

	dialog.ShowCustom("Invoice Detail", "Close", container.NewBorder(toolbar, nil, nil, nil,
		container.NewScroll(content)), s.win)
}

func (s *InvoiceScreen) customerNames(customers []models.Customer) []string {
	names := make([]string, len(customers))
	for i, c := range customers {
		names[i] = c.Name
	}
	return names
}

func parseDate(s string) time.Time {
	formats := []string{"2006-01-02", "02-01-2006", "2006/01/02", "Jan 2, 2006", "January 2, 2006"}
	s = strings.TrimSpace(s)
	for _, f := range formats {
		if t, err := time.Parse(f, s); err == nil {
			return t
		}
	}
	return time.Now()
}
