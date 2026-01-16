import { useState, useEffect, useRef } from 'react';
import { FetchMusicInfo, FetchPlayerState } from "../../wailsjs/go/main/App";
import { MusicInfo, PlayerState } from "../types";

export function useAimp(isLocked: boolean) {
    const [musicInfo, setMusicInfo] = useState<MusicInfo | null>(null);
    const [playerState, setPlayerState] = useState<PlayerState | null>(null);
    const [smoothPosition, setSmoothPosition] = useState<number>(0);
    const [shouldUnlock, setShouldUnlock] = useState(false);

    const lastFetchTimeRef = useRef<number>(Date.now());
    const basePositionRef = useRef<number>(0);
    const isPlayingRef = useRef<boolean>(false);
    const requestRef = useRef<number>();

    const updateSmoothPosition = () => {
        if (!isPlayingRef.current) {
            setSmoothPosition(basePositionRef.current);
        } else {
            const now = Date.now();
            const elapsed = now - lastFetchTimeRef.current;
            setSmoothPosition(basePositionRef.current + elapsed);
        }
        requestRef.current = requestAnimationFrame(updateSmoothPosition);
    };

    useEffect(() => {
        requestRef.current = requestAnimationFrame(updateSmoothPosition);
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, []);

    useEffect(() => {
        const fetchInterval = setInterval(() => {
            FetchPlayerState().then(state => {
                setPlayerState(state);
                
                basePositionRef.current = state.Position;
                lastFetchTimeRef.current = Date.now();
                isPlayingRef.current = state.State === 2;

                if (state.State !== 2 && isLocked) {
                    setShouldUnlock(true);
                } else {
                    setShouldUnlock(false);
                }
            });
        }, 1000); 

        return () => clearInterval(fetchInterval);
    }, [isLocked]);

    useEffect(() => {
        const timer = setInterval(() => {
            FetchMusicInfo().then(info => {
                setMusicInfo(prev => {
                    if (prev?.FileName !== info.FileName || prev?.TrackNumber !== info.TrackNumber) {
                        return info;
                    }
                    return prev;
                });
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    return { musicInfo, playerState, smoothPosition, shouldUnlock };
}