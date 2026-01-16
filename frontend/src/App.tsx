import { useState, useEffect, useRef, useLayoutEffect, useMemo, useCallback } from 'react';
import { SetWindowClickThrough, QuitApp, ResizeWindow } from "../wailsjs/go/main/App";
import { useAimp } from './hooks/useAimp';
import { useLyrics } from './hooks/useLyrics';
import { useConfig } from './hooks/useConfig';
import { ControlBar } from './components/ControlBar';
import { LyricRenderer } from './components/LyricRenderer';
import { SettingsPanel } from './components/SettingsPanel';

function App() {
    const [isLocked, setIsLocked] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const { config, setConfig, save: saveConfig, isLoaded } = useConfig();
    const { musicInfo, playerState, shouldUnlock } = useAimp(isLocked);
    const { mainText, subText } = useLyrics(musicInfo?.FileName, playerState?.Position);
    
    const lyricRef = useRef<HTMLDivElement>(null);
    const resizeTimeoutRef = useRef<number | null>(null);
    const isResizingRef = useRef(false);

    useEffect(() => {
        if (!config.windowWidth) {
            setConfig({ ...config, windowWidth: window.innerWidth });
        }
    }, []);

    useEffect(() => {
        if (shouldUnlock) setIsLocked(false);
    }, [shouldUnlock]);

    useEffect(() => {
        SetWindowClickThrough(isLocked);
    }, [isLocked]);

    const standardHeight = useMemo(() => {
        const safeMultiplier = 3.5; 
        const basePadding = 40; 
        return Math.ceil((config.fontSize * safeMultiplier) + basePadding);
    }, [config.fontSize]);

    const calculateTargetHeight = useCallback((contentHeight: number) => {
        const padding = 20; 
        return Math.ceil(Math.max(contentHeight + padding, standardHeight));
    }, [standardHeight]);

    useEffect(() => {
        const handleResize = () => {
            if (isSettingsOpen) return;
            
            isResizingRef.current = true;
            const currentW = window.innerWidth;
            const currentH = window.innerHeight;

            let targetH = standardHeight;
            if (lyricRef.current) {
                targetH = calculateTargetHeight(lyricRef.current.offsetHeight);
            }

            if (isLoaded && Math.abs(currentW - config.windowWidth) > 5) {
                if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
                resizeTimeoutRef.current = window.setTimeout(() => {
                    const newConfig = { ...config, windowWidth: currentW };
                    setConfig(newConfig);
                    saveConfig(newConfig);
                    isResizingRef.current = false;
                }, 200);
            }

            if (Math.abs(currentH - targetH) > 5) {
                ResizeWindow(currentW, targetH);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isSettingsOpen, config, standardHeight, calculateTargetHeight, setConfig, saveConfig, isLoaded]);

    useLayoutEffect(() => {
        if (isSettingsOpen) {
            ResizeWindow(400, 520);
        } else {
            if (lyricRef.current) {
                const targetH = calculateTargetHeight(lyricRef.current.offsetHeight);
                const targetW = config.windowWidth || window.innerWidth;
                
                ResizeWindow(Math.ceil(targetW), Math.ceil(targetH));
            }
        }
    }, [isSettingsOpen, mainText, subText, config.fontSize, config.windowWidth, calculateTargetHeight]);

    const handleOpenSettings = useCallback(() => {
        setConfig({ ...config, windowWidth: window.innerWidth });
        setIsSettingsOpen(true);
    }, [config, setConfig]);

    const handleCloseSettings = useCallback(() => {
        saveConfig(config);
        setIsSettingsOpen(false);
    }, [config, saveConfig]);

    const currentBgOpacity = isSettingsOpen ? 0.95 : config.bgOpacity;

    return (
        <div 
            className="anim-basic w-screen h-screen overflow-hidden flex flex-col relative border border-white/10 rounded-xl shadow-2xl"
            style={{ 
                // @ts-ignore
                "--wails-draggable": isLocked ? "none" : "drag",
                backgroundColor: `rgba(0, 0, 0, ${currentBgOpacity})`,
            }}
        >
            <div className={`flex-1 flex flex-col w-full h-full ${isSettingsOpen ? 'opacity-100' : 'opacity-100'} anim-fade`}>
                {isSettingsOpen ? (
                    <SettingsPanel config={config} onChange={setConfig} onClose={handleCloseSettings} />
                ) : (
                    <>
                        {!isLocked && (
                            <ControlBar 
                                fileName={musicInfo?.FileName}
                                onOpenSettings={handleOpenSettings}
                                onLock={() => setIsLocked(true)}
                                onClose={QuitApp}
                            />
                        )}
                        <div className="flex-1 flex items-center justify-center w-full min-h-0 px-4">
                            <LyricRenderer ref={lyricRef} mainText={mainText} subText={subText} config={config} />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default App;