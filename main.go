package main

import (
	"embed"
	"surrealist/backend"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	app := backend.NewApp()

	// Launch application
	err := wails.Run(&options.App{
		Title:            "Surrealist",
		Width:            1024,
		Height:           672,
		OnStartup:        app.Startup,
		BackgroundColour: options.NewRGB(244, 245, 251),
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		Bind: []interface{}{
			app,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
