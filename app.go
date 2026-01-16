package main

import (
	"context"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type App struct {
	ctx context.Context
}

func NewApp() *App {
	return &App{}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx

	config := LoadAppConfig()
	if config.WindowWidth > 0 {
		runtime.WindowSetSize(ctx, config.WindowWidth, 120)
	}
}

func (a *App) FetchMusicInfo() MusicInfo {
	return GetMusicInfo()
}

func (a *App) FetchPlayerState() PlayerState {
	return GetRealtimeState()
}

func (a *App) FetchLyrics(path string) []LyricLine {
	return LoadLyrics(path)
}

func (a *App) SetWindowClickThrough(enabled bool) {
	SetClickThrough(enabled)
}

func (a *App) GetConfig() AppConfig {
	return LoadAppConfig()
}

func (a *App) SaveConfig(config AppConfig) {
	SaveAppConfig(config)
}

func (a *App) QuitApp() {
	runtime.Quit(a.ctx)
}

func (a *App) ResizeWindow(width, height int) {
	runtime.WindowSetSize(a.ctx, width, height)
}
