//go:build !windows
// +build !windows

package backend

import (
	"os/exec"
	"syscall"
)

func spawnInBackground(cmd *exec.Cmd) {
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}
}
