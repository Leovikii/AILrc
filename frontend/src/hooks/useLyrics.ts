import { useState, useEffect } from 'react';
import { FetchLyrics } from "../../wailsjs/go/main/App";
import { LyricLine } from "../types";

export function useLyrics(fileName: string | undefined, position: number | undefined) {
    const [lyrics, setLyrics] = useState<LyricLine[]>([]);
    const [mainText, setMainText] = useState<string>("AILrc Ready");
    const [subText, setSubText] = useState<string>("");

    useEffect(() => {
        if (fileName) {
            FetchLyrics(fileName).then(lrc => setLyrics(lrc || []));
        }
    }, [fileName]);

    useEffect(() => {
        if (position === undefined || lyrics.length === 0) return;
        
        let left = 0;
        let right = lyrics.length - 1;
        let idx = -1;

        while (left <= right) {
            const mid = Math.floor((left + right) / 2);
            if (lyrics[mid].time <= position) {
                idx = mid;
                left = mid + 1;
            } else {
                right = mid - 1;
            }
        }

        if (idx !== -1) {
            setMainText(lyrics[idx].mainText);
            setSubText(lyrics[idx].subText);
        } else {
             if (position < lyrics[0].time) {
                 setMainText("...");
                 setSubText("");
             }
        }
    }, [position, lyrics]);

    return { mainText, subText };
}