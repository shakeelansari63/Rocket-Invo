package main

import (
	"log"
	"os"
	"path/filepath"

	"fyne.io/fyne/v2"
	"fyne.io/fyne/v2/app"
	"Rocket-Invo/internal/database"
	apptheme "Rocket-Invo/internal/ui/theme"
	"Rocket-Invo/internal/ui"
)

func main() {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		log.Fatal(err)
	}
	dbPath := filepath.Join(homeDir, ".rocket-invo", "data.db")

	db, err := database.New(dbPath)
	if err != nil {
		log.Fatalf("database init: %v", err)
	}
	defer db.Close()

	a := app.New()
	a.Settings().SetTheme(apptheme.NewCustomTheme())
	w := a.NewWindow("Rocket Invo")
	w.Resize(fyne.NewSize(1200, 800))

	appUI := ui.NewApp(db, w)
	w.SetContent(appUI.BuildUI())

	w.ShowAndRun()
}
