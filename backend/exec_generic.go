//go:build !windows
// +build !windows

package backend

import (
	"os/exec"
)

func spawnInBackground(cmd *exec.Cmd) {
}
