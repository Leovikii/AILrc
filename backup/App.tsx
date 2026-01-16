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
    const { config, setConfig, save: saveConfig } = useConfig();
    const { musicInfo, playerState, shouldUnlock } = useAimp(isLocked);
    const { mainText, subText } = useLyrics(musicInfo?.FileName, playerState?.Position);
    
    const lyricRef = useRef<HTMLDivElement>(null);
    const resizeTimeoutRef = useRef<number | null>(null);
    const isResizingRef = useRef(false);

    // 初始化：如果 config 中没有 windowWidth，默认为 800 (或当前宽度)
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

    // 计算标准高度：默认保持 2 行文字的高度
    const standardHeight = useMemo(() => {
        const lineHeight = 1.2; // 与 LyricRenderer 保持一致
        const verticalPadding = 30; // 上下留白
        // 2 行高度 + padding
        return Math.ceil((config.fontSize * lineHeight * 2) + verticalPadding);
    }, [config.fontSize]);

    // 计算目标高度：如果内容超过 2 行，则撑开；否则保持 2 行标准高度
    const calculateTargetHeight = useCallback((contentHeight: number) => {
        const padding = 30; 
        return Math.ceil(Math.max(contentHeight + padding, standardHeight));
    }, [standardHeight]);

    // 核心 Resize 逻辑：只允许宽变，高强制锁定
    useEffect(() => {
        const handleResize = () => {
            if (isSettingsOpen) return;
            
            isResizingRef.current = true;
            const currentW = window.innerWidth;
            const currentH = window.innerHeight;

            // 获取应该有的高度
            let targetH = standardHeight;
            if (lyricRef.current) {
                targetH = calculateTargetHeight(lyricRef.current.offsetHeight);
            }

            // 1. 如果宽度变了，保存配置（防抖）
            if (Math.abs(currentW - config.windowWidth) > 5) {
                if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
                resizeTimeoutRef.current = window.setTimeout(() => {
                    setConfig({ ...config, windowWidth: currentW });
                    isResizingRef.current = false;
                }, 200);
            }

            // 2. 如果高度不正确（用户试图拉高），强制弹回
            // 容差设为 5px，避免计算误差导致的死循环抖动
            if (Math.abs(currentH - targetH) > 5) {
                ResizeWindow(currentW, targetH);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isSettingsOpen, config, standardHeight, calculateTargetHeight, setConfig]);

    // 歌词变化或字体设置变化时，调整窗口尺寸
    useLayoutEffect(() => {
        if (isSettingsOpen) {
            ResizeWindow(400, 520); // Settings 窗口稍高一点以容纳更多选项
        } else {
            if (lyricRef.current) {
                const targetH = calculateTargetHeight(lyricRef.current.offsetHeight);
                // 宽度优先使用保存的配置，如果没有则用当前宽度
                const targetW = config.windowWidth || window.innerWidth;
                
                ResizeWindow(Math.ceil(targetW), Math.ceil(targetH));
            }
        }
    }, [isSettingsOpen, mainText, subText, config.fontSize, config.windowWidth, calculateTargetHeight]);

    const handleOpenSettings = useCallback(() => {
        // 打开前先保存当前宽度，防止丢失
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
                        {/* 垂直居中 (items-center) + 移除顶部大 padding */}
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