export interface MusicInfo {
    FileName: string;
    TrackNumber: number;
}

export interface PlayerState {
    Position: number;
    State: number;
}

export interface LyricLine {
    time: number;
    mainText: string;
    subText: string;
}

export interface AppConfig {
    fontSize: number;
    fontColor: string;
    strokeColor: string;
    textOpacity: number;
    bgOpacity: number;
    windowWidth: number;
}