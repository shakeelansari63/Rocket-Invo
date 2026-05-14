package inventory

import (
	"fmt"
	"Rocket-Invo/internal/models"
	"Rocket-Invo/internal/repository"

	"fyne.io/fyne/v2"
	"fyne.io/fyne/v2/container"
	"fyne.io/fyne/v2/dialog"
	"fyne.io/fyne/v2/widget"
)

type InventoryScreen struct {
	repo     *repository.ProductRepo
	products []models.Product
	list     *widget.List
	search   *widget.Entry
	win      fyne.Window
}

func NewInventoryScreen(repo *repository.ProductRepo, win fyne.Window) *InventoryScreen {
	return &InventoryScreen{repo: repo, win: win}
}

func (s *InventoryScreen) BuildUI() fyne.CanvasObject {
	s.search = widget.NewEntry()
	s.search.SetPlaceHolder("Search name, SKU or category...")
	s.search.OnChanged = func(q string) {
		if q == "" {
			s.refresh()
		}
	}
	s.search.OnSubmitted = func(q string) {
		s.refreshWithSearch(q)
	}

	s.list = widget.NewList(
		func() int { return len(s.products) },
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
			p := s.products[id]
			grid := item.(*fyne.Container)
			grid.Objects[0].(*widget.Label).SetText(p.Name)
			grid.Objects[1].(*widget.Label).SetText(string(p.Type))
			if p.Type == models.ProductSellable {
				grid.Objects[2].(*widget.Label).SetText(fmt.Sprintf("₹%.2f", p.Price))
			} else {
				grid.Objects[2].(*widget.Label).SetText(fmt.Sprintf("₹%.2f/hr", p.RentalHourly))
			}
			grid.Objects[3].(*widget.Label).SetText(fmt.Sprintf("%d", p.StockQty))
			grid.Objects[4].(*widget.Label).SetText(p.SKU)
		},
	)

	s.list.OnSelected = func(id widget.ListItemID) {
		s.showEditDialog(s.products[id])
		s.list.Unselect(id)
	}

	toolbar := container.NewBorder(nil, nil,
		widget.NewButton("Add Product", s.showAddDialog),
		widget.NewButton("Refresh", s.refresh),
		s.search,
	)

	content := container.NewBorder(toolbar, nil, nil, nil, s.list)
	s.refresh()
	return content
}

func (s *InventoryScreen) refresh() {
	products, err := s.repo.GetAll()
	if err != nil {
		return
	}
	s.products = products
	s.list.Refresh()
}

func (s *InventoryScreen) refreshWithSearch(q string) {
	products, err := s.repo.Search(q)
	if err != nil {
		return
	}
	s.products = products
	s.list.Refresh()
}

func (s *InventoryScreen) showAddDialog() {
	p := &models.Product{}
	s.showForm("Add Product", p, false)
}

func (s *InventoryScreen) showEditDialog(p models.Product) {
	s.showForm("Edit Product", &p, true)
}

func (s *InventoryScreen) showForm(title string, p *models.Product, edit bool) {
	nameEntry := widget.NewEntry()
	nameEntry.SetText(p.Name)
	skuEntry := widget.NewEntry()
	skuEntry.SetText(p.SKU)
	descEntry := widget.NewMultiLineEntry()
	descEntry.SetText(p.Description)

	typeSelect := widget.NewSelect([]string{"Sellable", "Rentable"}, nil)
	typeOpts := map[string]models.ProductType{"Sellable": models.ProductSellable, "Rentable": models.ProductRentable}
	initialType := "Sellable"
	if p.Type == models.ProductRentable {
		initialType = "Rentable"
	}
	typeSelect.SetSelected(initialType)

	priceEntry := widget.NewEntry()
	costEntry := widget.NewEntry()
	priceEntry.SetText(fmt.Sprintf("%.2f", p.Price))
	costEntry.SetText(fmt.Sprintf("%.2f", p.Cost))

	hourlyEntry := widget.NewEntry()
	dailyEntry := widget.NewEntry()
	monthlyEntry := widget.NewEntry()
	hourlyEntry.SetText(fmt.Sprintf("%.2f", p.RentalHourly))
	dailyEntry.SetText(fmt.Sprintf("%.2f", p.RentalDaily))
	monthlyEntry.SetText(fmt.Sprintf("%.2f", p.RentalMonthly))

	dynamicForm := container.NewVBox()

	rebuildDynamic := func() {
		dynamicForm.Objects = nil
		if typeSelect.Selected == "Rentable" {
			dynamicForm.Add(widget.NewForm(
				widget.NewFormItem("Hourly Rate", hourlyEntry),
				widget.NewFormItem("Daily Rate", dailyEntry),
				widget.NewFormItem("Monthly Rate", monthlyEntry),
			))
		} else {
			dynamicForm.Add(widget.NewForm(
				widget.NewFormItem("Price", priceEntry),
				widget.NewFormItem("Cost", costEntry),
			))
		}
		dynamicForm.Refresh()
	}

	typeSelect.OnChanged = func(_ string) {
		rebuildDynamic()
	}
	rebuildDynamic()

	qtyEntry := widget.NewEntry()
	qtyEntry.SetText(fmt.Sprintf("%d", p.StockQty))
	minEntry := widget.NewEntry()
	minEntry.SetText(fmt.Sprintf("%d", p.MinStock))
	catEntry := widget.NewEntry()
	catEntry.SetText(p.Category)
	supplierEntry := widget.NewEntry()
	supplierEntry.SetText(p.Supplier)

	content := container.NewVBox(
		widget.NewForm(
			widget.NewFormItem("Name", nameEntry),
			widget.NewFormItem("SKU", skuEntry),
			widget.NewFormItem("Type", typeSelect),
			widget.NewFormItem("Description", descEntry),
		),
		dynamicForm,
		widget.NewForm(
			widget.NewFormItem("Stock Qty", qtyEntry),
			widget.NewFormItem("Min Stock", minEntry),
			widget.NewFormItem("Category", catEntry),
			widget.NewFormItem("Supplier", supplierEntry),
		),
	)

	d := dialog.NewCustomConfirm(title, "Save", "Cancel", content,
		func(ok bool) {
			if !ok {
				return
			}
			p.Name = nameEntry.Text
			p.SKU = skuEntry.Text
			p.Description = descEntry.Text
			p.Type = typeOpts[typeSelect.Selected]

			if p.Type == models.ProductRentable {
				fmt.Sscanf(hourlyEntry.Text, "%f", &p.RentalHourly)
				fmt.Sscanf(dailyEntry.Text, "%f", &p.RentalDaily)
				fmt.Sscanf(monthlyEntry.Text, "%f", &p.RentalMonthly)
				p.Price = 0
				p.Cost = 0
			} else {
				fmt.Sscanf(priceEntry.Text, "%f", &p.Price)
				fmt.Sscanf(costEntry.Text, "%f", &p.Cost)
				p.RentalHourly = 0
				p.RentalDaily = 0
				p.RentalMonthly = 0
			}

			fmt.Sscanf(qtyEntry.Text, "%d", &p.StockQty)
			fmt.Sscanf(minEntry.Text, "%d", &p.MinStock)
			p.Category = catEntry.Text
			p.Supplier = supplierEntry.Text

			var err error
			if edit {
				err = s.repo.Update(p)
			} else {
				_, err = s.repo.Create(p)
			}
			if err != nil {
				dialog.ShowError(err, s.win)
				return
			}
			s.refresh()
		},
		s.win,
	)
	d.Resize(fyne.NewSize(520, 520))
	d.Show()
}
