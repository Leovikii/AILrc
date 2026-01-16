package main

import (
	"encoding/binary"
	"sync"
	"syscall"
	"unicode/utf16"
	"unsafe"
)

var (
	moduser32               = syscall.NewLazyDLL("user32.dll")
	procFindWindowW         = moduser32.NewProc("FindWindowW")
	procSendMessageW        = moduser32.NewProc("SendMessageW")
	procSendMessageTimeoutW = moduser32.NewProc("SendMessageTimeoutW")
	procIsWindow            = moduser32.NewProc("IsWindow")

	modkernel32         = syscall.NewLazyDLL("kernel32.dll")
	procOpenFileMap     = modkernel32.NewProc("OpenFileMappingW")
	procMapViewOfFile   = modkernel32.NewProc("MapViewOfFile")
	procUnmapViewOfFile = modkernel32.NewProc("UnmapViewOfFile")
	procCloseHandle     = modkernel32.NewProc("CloseHandle")
)

const (
	FILE_MAP_READ    = 0x0004
	SMTO_ABORTIFHUNG = 0x0002
)

type MusicInfo struct {
	Title       string
	Artist      string
	Album       string
	FileName    string
	Duration    int
	TrackNumber int
	IsActive    bool
}

type PlayerState struct {
	Position int
	State    int
}

type AIMPClient struct {
	hwnd uintptr
	hMap uintptr
	addr uintptr
	mu   sync.Mutex
}

var client = &AIMPClient{}

func GetMusicInfo() MusicInfo {
	client.mu.Lock()
	defer client.mu.Unlock()

	if !client.ensureConnected() {
		return MusicInfo{}
	}

	getData := func(offset int) uint32 {
		return binary.LittleEndian.Uint32(client.readBytes(offset, 4))
	}

	active := getData(OffsetActive)
	duration := getData(OffsetDuration)
	trackNum := getData(OffsetTrackNumber)

	lenAlbum := getData(OffsetAlbumLength)
	lenArtist := getData(OffsetArtistLength)
	lenFileName := getData(OffsetFileNameLength)
	lenTitle := getData(OffsetTitleLength)

	currentOffset := HeaderSize

	album := client.readString(currentOffset, int(lenAlbum))
	currentOffset += int(lenAlbum) * 2

	artist := client.readString(currentOffset, int(lenArtist))
	currentOffset += int(lenArtist) * 2

	currentOffset += int(getData(OffsetDateLength)) * 2

	fileName := client.readString(currentOffset, int(lenFileName))
	currentOffset += int(lenFileName) * 2

	currentOffset += int(getData(OffsetGenreLength)) * 2

	title := client.readString(currentOffset, int(lenTitle))

	return MusicInfo{
		Title:       title,
		Artist:      artist,
		Album:       album,
		FileName:    fileName,
		Duration:    int(duration),
		TrackNumber: int(trackNum),
		IsActive:    active != 0,
	}
}

func GetRealtimeState() PlayerState {
	client.mu.Lock()
	defer client.mu.Unlock()

	if !client.ensureConnected() {
		return PlayerState{State: StateStopped, Position: 0}
	}

	var stateResult, posResult uintptr

	ret1, _, _ := procSendMessageTimeoutW.Call(
		client.hwnd,
		WM_AIMP_PROPERTY,
		uintptr(AIMP_RA_PROPERTY_PLAYER_STATE),
		0,
		SMTO_ABORTIFHUNG,
		200,
		uintptr(unsafe.Pointer(&stateResult)),
	)

	ret2, _, _ := procSendMessageTimeoutW.Call(
		client.hwnd,
		WM_AIMP_PROPERTY,
		uintptr(AIMP_RA_PROPERTY_PLAYER_POSITION),
		0,
		SMTO_ABORTIFHUNG,
		200,
		uintptr(unsafe.Pointer(&posResult)),
	)

	if ret1 == 0 || ret2 == 0 {
		return PlayerState{State: StateStopped, Position: 0}
	}

	return PlayerState{
		State:    int(stateResult),
		Position: int(posResult),
	}
}

func (c *AIMPClient) ensureConnected() bool {
	if c.hwnd != 0 {
		ret, _, _ := procIsWindow.Call(c.hwnd)
		if ret == 0 {
			c.disconnect()
		}
	}

	if c.hwnd == 0 {
		ptr, _ := syscall.UTF16PtrFromString(AIMPRemoteAccessClass)
		hwnd, _, _ := procFindWindowW.Call(uintptr(unsafe.Pointer(ptr)), uintptr(unsafe.Pointer(ptr)))
		if hwnd == 0 {
			return false
		}
		c.hwnd = hwnd
	}

	if c.addr == 0 {
		mapNamePtr, _ := syscall.UTF16PtrFromString(AIMPRemoteAccessClass)
		hMap, _, _ := procOpenFileMap.Call(FILE_MAP_READ, 0, uintptr(unsafe.Pointer(mapNamePtr)))
		if hMap == 0 {
			return false
		}

		addr, _, _ := procMapViewOfFile.Call(hMap, FILE_MAP_READ, 0, 0, AIMPRemoteAccessMapFileSize)
		if addr == 0 {
			procCloseHandle.Call(hMap)
			return false
		}

		c.hMap = hMap
		c.addr = addr
	}

	return true
}

func (c *AIMPClient) disconnect() {
	if c.addr != 0 {
		procUnmapViewOfFile.Call(c.addr)
		c.addr = 0
	}
	if c.hMap != 0 {
		procCloseHandle.Call(c.hMap)
		c.hMap = 0
	}
	c.hwnd = 0
}

func (c *AIMPClient) readBytes(offset int, length int) []byte {
	if c.addr == 0 {
		return make([]byte, length)
	}
	data := make([]byte, length)
	targetAddr := c.addr + uintptr(offset)
	for i := 0; i < length; i++ {
		data[i] = *(*byte)(unsafe.Pointer(targetAddr + uintptr(i)))
	}
	return data
}

func (c *AIMPClient) readString(offset int, utf16Len int) string {
	if utf16Len == 0 || c.addr == 0 {
		return ""
	}
	raw := c.readBytes(offset, utf16Len*2)
	shorts := make([]uint16, utf16Len)
	for i := 0; i < utf16Len; i++ {
		shorts[i] = binary.LittleEndian.Uint16(raw[i*2 : i*2+2])
	}
	return string(utf16.Decode(shorts))
}
