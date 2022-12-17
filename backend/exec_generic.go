//go:build !windows
// +build !windows

package backend

import (
	"os/exec"
	"strings"
)

func buildCommand(args []string) []string {
	return []string{
		"/bin/sh",
		"-c",
		strings.Join(args, " ")
	}
}

func spawnInBackground(cmd *exec.Cmd) {
}
