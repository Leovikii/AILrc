package main

const (
	WM_USER          = 0x0400
	WM_AIMP_COMMAND  = WM_USER + 0x75
	WM_AIMP_PROPERTY = WM_USER + 0x77
)

const (
	AIMP_RA_PROPERTY_PLAYER_POSITION = 0x20
	AIMP_RA_PROPERTY_PLAYER_STATE    = 0x40
)

const (
	StateStopped = 0
	StatePaused  = 1
	StatePlaying = 2
)

const (
	AIMPRemoteAccessClass       = "AIMP2_RemoteInfo"
	AIMPRemoteAccessMapFileSize = 2048
)

const (
	OffsetActive         = 4
	OffsetDuration       = 16
	OffsetFileSize       = 20
	OffsetTrackNumber    = 36
	OffsetAlbumLength    = 40
	OffsetArtistLength   = 44
	OffsetDateLength     = 48
	OffsetFileNameLength = 52
	OffsetGenreLength    = 56
	OffsetTitleLength    = 60
	HeaderSize           = 88
)
