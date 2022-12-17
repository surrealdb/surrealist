package backend

import (
	"context"
	"os"
)

const DEFAULT_CONFIG = "{\"theme\":\"light\",\"autoConnect\":true,\"tableSuggest\":true,\"wordWrap\":true,\"localDriver\":\"memory\",\"localStorage\":\"\",\"tabs\":[],\"history\":[]}"

type Surrealist struct {
	ctx          context.Context
	isPinned     bool
	isServing    bool
	serverHandle *os.Process
}

func NewApp() *Surrealist {
	return &Surrealist{}
}

func (a *Surrealist) Startup(ctx context.Context) {
	a.ctx = ctx
}
