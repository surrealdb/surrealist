package backend

import (
	"bytes"
	"fmt"
	"os/exec"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// Start the local database
func (a *Surrealist) StartDatabase(user string, pass string, port uint32, driver string, storage string) {
	if a.isServing {
		a.StopDatabase()
	}

	args := []string{
		"surreal",
		"start",
		"--bind", fmt.Sprintf("0.0.0.0:%d", port),
		"--user", user,
		"--pass", pass,
	}

	switch driver {
	case "memory":
		args = append(args, "memory")
	case "file":
		args = append(args, "file://"+storage)
	case "tikv":
		args = append(args, "tikv://"+storage)
	}

	go func() {
		a.isServing = true

		defer func() {
			runtime.LogInfo(a.ctx, "it has exited")

			a.isServing = false
			a.serverHandle = nil
		}()

		cmdArgs := buildCommand(args)
		cmd := exec.Command(cmdArgs[0], cmdArgs[1:]...)

		spawnInBackground(cmd)

		var outb, errb bytes.Buffer
		cmd.Stdout = &outb
		cmd.Stderr = &errb

		if err := cmd.Start(); err != nil {
			runtime.EventsEmit(a.ctx, "database:error", err.Error())
			return
		}

		a.serverHandle = cmd.Process

		runtime.EventsEmit(a.ctx, "database:start")
		runtime.LogInfo(a.ctx, fmt.Sprintf("Local database started with args: %v", cmdArgs))

		cmd.Wait()

		runtime.EventsEmit(a.ctx, "database:stop")
		runtime.LogInfo(a.ctx, "Local database stopped")
		runtime.LogInfo(a.ctx, outb.String())
		runtime.LogInfo(a.ctx, errb.String())
	}()
}

// Stop the local database
func (a *Surrealist) StopDatabase() {
	runtime.LogInfo(a.ctx, "Stopping local database")

	if !a.isServing {
		return
	}

	// We should probably not kill but send a SIGINT, right?
	// But this works for now.
	err := killProcess(a.serverHandle)

	if err != nil {
		runtime.LogError(a.ctx, fmt.Sprintf("Failed to kill local database: %v", err))
	}
}
