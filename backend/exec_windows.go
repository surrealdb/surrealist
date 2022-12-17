//go:build windows
// +build windows

package backend

import (
	"fmt"
	"os"
	"os/exec"
	"strings"
	"syscall"
)

func buildCommand(args []string) []string {
	return []string{
		"cmd",
		"/c",
		strings.Join(args, " "),
	}
}

func spawnInBackground(cmd *exec.Cmd) {
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}
}

func killProcess(proc *os.Process) error {
	return exec.Command("taskkill", "/pid", fmt.Sprint(proc.Pid), "/f", "/t").Run()
}
