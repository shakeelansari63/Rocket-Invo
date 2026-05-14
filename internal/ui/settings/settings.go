package settings

import (
	"Rocket-Invo/internal/repository"

	"fyne.io/fyne/v2"
	"fyne.io/fyne/v2/container"
	"fyne.io/fyne/v2/dialog"
	"fyne.io/fyne/v2/widget"
)

type SettingsScreen struct {
	repo *repository.SettingsRepo
	win  fyne.Window
}

func NewSettingsScreen(repo *repository.SettingsRepo, win fyne.Window) *SettingsScreen {
	return &SettingsScreen{repo: repo, win: win}
}

func (s *SettingsScreen) BuildUI() fyne.CanvasObject {
	settings, err := s.repo.GetAll()
	if err != nil {
		return widget.NewLabel("Error loading settings")
	}

	bizName := widget.NewEntry()
	bizName.SetText(settings["business_name"])

	bizAddr := widget.NewMultiLineEntry()
	bizAddr.SetText(settings["business_address"])

	bizPhone := widget.NewEntry()
	bizPhone.SetText(settings["business_phone"])

	bizEmail := widget.NewEntry()
	bizEmail.SetText(settings["business_email"])

	taxRate := widget.NewEntry()
	taxRate.SetText(settings["tax_rate"])

	currency := widget.NewEntry()
	currency.SetText(settings["currency"])

	invPrefix := widget.NewEntry()
	invPrefix.SetText(settings["invoice_prefix"])

	form := widget.NewForm(
		widget.NewFormItem("Business Name", bizName),
		widget.NewFormItem("Address", bizAddr),
		widget.NewFormItem("Phone", bizPhone),
		widget.NewFormItem("Email", bizEmail),
		widget.NewFormItem("Tax Rate (%)", taxRate),
		widget.NewFormItem("Currency Symbol", currency),
		widget.NewFormItem("Invoice Prefix", invPrefix),
	)

	saveBtn := widget.NewButton("Save Settings", func() {
		pairs := map[string]string{
			"business_name":    bizName.Text,
			"business_address": bizAddr.Text,
			"business_phone":   bizPhone.Text,
			"business_email":   bizEmail.Text,
			"tax_rate":         taxRate.Text,
			"currency":         currency.Text,
			"invoice_prefix":   invPrefix.Text,
		}
		for k, v := range pairs {
			if err := s.repo.Set(k, v); err != nil {
				dialog.ShowError(err, s.win)
				return
			}
		}
		dialog.ShowInformation("Success", "Settings saved", s.win)
	})

	return container.NewScroll(container.NewVBox(
		widget.NewLabelWithStyle("Business Settings", fyne.TextAlignLeading, fyne.TextStyle{Bold: true}),
		form,
		saveBtn,
	))
}
