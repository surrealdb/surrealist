//go:build windows
// +build windows

package backend

import (
	"os/exec"
	"syscall"
)

func buildCommand(args []string) []string {
	return args
}

func spawnInBackground(cmd *exec.Cmd) {
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}
}
