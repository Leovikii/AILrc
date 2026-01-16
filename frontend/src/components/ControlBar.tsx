interface ControlBarProps {
    onOpenSettings: () => void;
    onLock: () => void;
    onClose: () => void;
    fileName?: string;
}

export function ControlBar({ onOpenSettings, onLock, onClose, fileName }: ControlBarProps) {
    const getCleanFileName = (path: string) => {
        const name = path.split(/[\\/]/).pop() || "";
        return name.replace(/\.[^/.]+$/, "");
    };

    const displayFileName = fileName ? getCleanFileName(fileName) : "No File";

    return (
        <div className="absolute top-0 left-0 right-0 p-2 flex justify-between items-start z-50 group pointer-events-auto">
             <div className="text-[11px] font-medium text-white/50 group-hover:text-white/90 bg-black/10 group-hover:bg-black/40 px-2 py-1 rounded-md transition-all truncate max-w-55 select-none backdrop-blur-sm">
                {displayFileName}
            </div>

            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-in-out">
                <button 
                    onClick={onOpenSettings}
                    className="p-1.5 hover:bg-white/10 rounded-md text-white/50 hover:text-white transition-colors cursor-pointer"
                    title="Settings"
                    style={{ "--wails-draggable": "none" } as any}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3"></circle>
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                    </svg>
                </button>
                <button 
                    onClick={onLock}
                    className="p-1.5 hover:bg-white/10 rounded-md text-white/50 hover:text-white transition-colors cursor-pointer"
                    title="Lock Window"
                    style={{ "--wails-draggable": "none" } as any}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                </button>
                <button 
                    onClick={onClose}
                    className="p-1.5 hover:bg-red-500/20 hover:text-red-400 rounded-md text-white/50 transition-colors cursor-pointer"
                    title="Close App"
                    style={{ "--wails-draggable": "none" } as any}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
        </div>
    );
}