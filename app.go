package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

const DEFAULT_CONFIG = "{\"theme\":\"light\",\"autoConnect\":true,\"tableSuggest\":true,\"wordWrap\":true,\"tabs\":[]}"

// App struct
type App struct {
	ctx      context.Context
	isPinned bool
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

func getConfigPath() string {
	homeDir, err := os.UserHomeDir()

	if err != nil {
		fmt.Println("Error getting home directory:", err)
		os.Exit(1)
	}

	return path.Join(homeDir, ".surrealist.json")
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// Load the config from disk
func (a *App) LoadConfig() string {
	contents, err := os.ReadFile(getConfigPath())

	if err != nil {
		a.SaveConfig(DEFAULT_CONFIG)
		return DEFAULT_CONFIG
	}

	return string(contents)
}

// Save the config to disk
func (a *App) SaveConfig(config string) {
	if !json.Valid([]byte(config)) {
		fmt.Println("Error saving config: Invalid JSON")
		return
	}

	err := os.WriteFile(getConfigPath(), []byte(config), 0644)

	if err != nil {
		fmt.Println("Error saving config:", err)
	}
}

// Toggle the pinned status of the window
func (a *App) TogglePinned() {
	a.isPinned = !a.isPinned

	runtime.WindowSetAlwaysOnTop(a.ctx, a.isPinned)
}
