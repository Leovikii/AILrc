package main

import (
	"encoding/json"
	"os"
	"path/filepath"
)

type AppConfig struct {
	FontSize    int     `json:"fontSize"`
	FontColor   string  `json:"fontColor"`
	StrokeColor string  `json:"strokeColor"`
	BgOpacity   float64 `json:"bgOpacity"`
	TextOpacity float64 `json:"textOpacity"`
	WindowWidth int     `json:"windowWidth"`
}

func DefaultConfig() AppConfig {
	return AppConfig{
		FontSize:    48,
		FontColor:   "#FFFFFF",
		StrokeColor: "#000000",
		BgOpacity:   0.6,
		TextOpacity: 1.0,
		WindowWidth: 800,
	}
}

func GetConfigPath() string {
	configDir, err := os.UserConfigDir()
	if err != nil {
		return "config.json"
	}
	appDir := filepath.Join(configDir, "AILrc")
	os.MkdirAll(appDir, 0755)
	return filepath.Join(appDir, "config.json")
}

func LoadAppConfig() AppConfig {
	config := DefaultConfig()

	path := GetConfigPath()
	data, err := os.ReadFile(path)
	if err == nil {
		json.Unmarshal(data, &config)
	}

	if config.WindowWidth < 400 {
		config.WindowWidth = 800
	}
	if config.TextOpacity <= 0 {
		config.TextOpacity = 1.0
	}

	return config
}

func SaveAppConfig(config AppConfig) error {
	path := GetConfigPath()
	data, err := json.MarshalIndent(config, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(path, data, 0644)
}
