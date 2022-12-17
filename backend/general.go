package backend

import (
	"encoding/json"
	"fmt"
	"os"
	"path"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

func getConfigPath() string {
	homeDir, err := os.UserHomeDir()

	if err != nil {
		fmt.Println("Error getting home directory:", err)
		os.Exit(1)
	}

	return path.Join(homeDir, ".surrealist.json")
}

// Load the config from disk
func (a *Surrealist) LoadConfig() string {
	contents, err := os.ReadFile(getConfigPath())

	if err != nil {
		a.SaveConfig(DEFAULT_CONFIG)
		return DEFAULT_CONFIG
	}

	return string(contents)
}

// Save the config to disk
func (a *Surrealist) SaveConfig(config string) {
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
func (a *Surrealist) TogglePinned() {
	a.isPinned = !a.isPinned

	runtime.WindowSetAlwaysOnTop(a.ctx, a.isPinned)
}
