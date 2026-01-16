package main

import (
	"syscall"
	"unsafe"
)

var (
	moduser32_win       = syscall.NewLazyDLL("user32.dll")
	procGetWindowLongW  = moduser32_win.NewProc("GetWindowLongW")
	procSetWindowLongW  = moduser32_win.NewProc("SetWindowLongW")
	procFindWindowW_win = moduser32_win.NewProc("FindWindowW")
)

const (
	GWL_EXSTYLE       = 0xFFFFFFEC
	WS_EX_LAYERED     = 0x80000
	WS_EX_TRANSPARENT = 0x20
)

func SetClickThrough(enabled bool) {
	title, _ := syscall.UTF16PtrFromString("AILrc")
	hwnd, _, _ := procFindWindowW_win.Call(0, uintptr(unsafe.Pointer(title)))

	if hwnd == 0 {
		return
	}

	style, _, _ := procGetWindowLongW.Call(hwnd, uintptr(uint32(GWL_EXSTYLE)))

	if enabled {
		style = style | WS_EX_LAYERED | WS_EX_TRANSPARENT
	} else {
		style = style &^ WS_EX_TRANSPARENT
	}

	procSetWindowLongW.Call(hwnd, uintptr(uint32(GWL_EXSTYLE)), style)
}
