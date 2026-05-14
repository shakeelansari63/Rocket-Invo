package customer

import (
	"Rocket-Invo/internal/models"
	"Rocket-Invo/internal/repository"

	"fyne.io/fyne/v2"
	"fyne.io/fyne/v2/container"
	"fyne.io/fyne/v2/dialog"
	"fyne.io/fyne/v2/widget"
)

type CustomerScreen struct {
	repo      *repository.CustomerRepo
	customers []models.Customer
	list      *widget.List
	win       fyne.Window
}

func NewCustomerScreen(repo *repository.CustomerRepo, win fyne.Window) *CustomerScreen {
	return &CustomerScreen{repo: repo, win: win}
}

func (s *CustomerScreen) BuildUI() fyne.CanvasObject {
	s.list = widget.NewList(
		func() int { return len(s.customers) },
		func() fyne.CanvasObject {
			return container.NewGridWithColumns(3,
				widget.NewLabel(""),
				widget.NewLabel(""),
				widget.NewLabel(""),
			)
		},
		func(id widget.ListItemID, item fyne.CanvasObject) {
			c := s.customers[id]
			grid := item.(*fyne.Container)
			grid.Objects[0].(*widget.Label).SetText(c.Name)
			grid.Objects[1].(*widget.Label).SetText(c.Phone)
			grid.Objects[2].(*widget.Label).SetText(c.Email)
		},
	)

	s.list.OnSelected = func(id widget.ListItemID) {
		s.showEditDialog(s.customers[id])
		s.list.Unselect(id)
	}

	toolbar := container.NewHBox(
		widget.NewButton("Add Customer", s.showAddDialog),
		widget.NewButton("Refresh", s.refresh),
	)

	content := container.NewBorder(toolbar, nil, nil, nil, s.list)
	s.refresh()
	return content
}

func (s *CustomerScreen) refresh() {
	customers, err := s.repo.GetAll()
	if err != nil {
		return
	}
	s.customers = customers
	s.list.Refresh()
}

func (s *CustomerScreen) showAddDialog() {
	s.showForm("Add Customer", &models.Customer{}, false)
}

func (s *CustomerScreen) showEditDialog(c models.Customer) {
	s.showForm("Edit Customer", &c, true)
}

func (s *CustomerScreen) showForm(title string, c *models.Customer, edit bool) {
	nameEntry := widget.NewEntry()
	nameEntry.SetText(c.Name)
	phoneEntry := widget.NewEntry()
	phoneEntry.SetText(c.Phone)
	emailEntry := widget.NewEntry()
	emailEntry.SetText(c.Email)
	addressEntry := widget.NewMultiLineEntry()
	addressEntry.SetText(c.Address)

	d := dialog.NewForm(title, "Save", "Cancel",
		[]*widget.FormItem{
			widget.NewFormItem("Name", nameEntry),
			widget.NewFormItem("Phone", phoneEntry),
			widget.NewFormItem("Email", emailEntry),
			widget.NewFormItem("Address", addressEntry),
		},
		func(ok bool) {
			if !ok {
				return
			}
			c.Name = nameEntry.Text
			c.Phone = phoneEntry.Text
			c.Email = emailEntry.Text
			c.Address = addressEntry.Text

			var err error
			if edit {
				err = s.repo.Update(c)
			} else {
				_, err = s.repo.Create(c)
			}
			if err != nil {
				dialog.ShowError(err, s.win)
				return
			}
			s.refresh()
		},
		s.win,
	)
	d.Resize(fyne.NewSize(520, 400))
	d.Show()
}
