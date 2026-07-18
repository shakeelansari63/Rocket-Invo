.PHONY: dev build electron clean

dev:
ifdef FLATPAK_XDG_DATA_HOME
	@echo "============================================================="
	@echo "  Cannot run Electron inside Flatpak sandbox."
	@echo "  Open a HOST terminal (outside Flatpak) and run:"
	@echo ""
	@echo "    cd $(CURDIR) && ./run-dev.sh"
	@echo ""
	@echo "  Or use Konsole/GNOME Terminal/etc. directly."
	@echo "============================================================="
else
	cd $(CURDIR) && ./run-dev.sh
endif

build:
	npm run build:electron && npm run build

electron:
	npm run build:electron

clean:
	rm -rf electron-dist dist release node_modules/.vite
