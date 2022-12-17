//go:build linux
// +build linux

package backend

import (
	"fmt"
	"os"
	"os/exec"
	"strings"
)

func buildCommand(args []string) []string {
	return []string{
		"bash",
		"-l",
		"-c",
		strings.Join(args, " "),
	}
}

func spawnInBackground(cmd *exec.Cmd) {
}

func killProcess(proc *os.Process) error {
	return exec.Command("kill", "-9", fmt.Sprint(proc.Pid)).Run()
}
