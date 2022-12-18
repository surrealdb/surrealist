package backend

import (
	"context"
	"os"
)

const DEFAULT_CONFIG = "{}"

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
