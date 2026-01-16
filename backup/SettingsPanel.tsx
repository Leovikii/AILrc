import { useState, useRef, useEffect, useCallback } from 'react';
import { AppConfig } from '../types';

interface SettingsPanelProps {
    config: AppConfig;
    onChange: (newConfig: AppConfig) => void;
    onClose: () => void;
}

interface CustomSliderProps {
    label: string;
    value: number;
    min: number;
    max: number;
    step?: number;
    unit?: string;
    displayFn?: (val: number) => string;
    onChange: (val: number) => void;
}

const CustomSlider = ({ label, value, min, max, step, unit, displayFn, onChange }: CustomSliderProps) => {
    const trackRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const safeValue = value ?? min;
    const percentage = Math.min(100, Math.max(0, ((safeValue - min) / (max - min)) * 100));

    const calculateValue = useCallback((clientX: number) => {
        if (!trackRef.current) return;
        const rect = trackRef.current.getBoundingClientRect();
        
        let percent = (clientX - rect.left) / rect.width;
        percent = Math.max(0, Math.min(1, percent));
        
        let rawValue = min + percent * (max - min);
        
        if (step) {
            rawValue = Math.round(rawValue / step) * step;
        }
        
        const newValue = parseFloat(rawValue.toFixed(2));
        onChange(newValue);
    }, [min, max, step, onChange]);

    const handlePointerDown = (e: React.PointerEvent) => {
        e.preventDefault();
        e.stopPropagation(); 
        setIsDragging(true);
        calculateValue(e.clientX);
    };

    useEffect(() => {
        if (!isDragging) return;
        const handleGlobalMove = (e: PointerEvent) => {
            e.preventDefault();
            calculateValue(e.clientX);
        };
        const handleGlobalUp = (e: PointerEvent) => {
            e.preventDefault();
            setIsDragging(false);
        };
        window.addEventListener('pointermove', handleGlobalMove);
        window.addEventListener('pointerup', handleGlobalUp);
        window.addEventListener('pointercancel', handleGlobalUp);
        return () => {
            window.removeEventListener('pointermove', handleGlobalMove);
            window.removeEventListener('pointerup', handleGlobalUp);
            window.removeEventListener('pointercancel', handleGlobalUp);
        };
    }, [isDragging, calculateValue]);

    return (
        <section className="space-y-3 select-none">
            <div className="flex justify-between items-center text-[11px] font-bold text-white/50 uppercase tracking-wider">
                <span>{label}</span>
                <span className={`font-mono transition-colors ${isDragging ? 'text-pink-400' : 'text-white/30'}`}>
                    {displayFn ? displayFn(safeValue) : `${safeValue}${unit || ''}`}
                </span>
            </div>
            
            <div 
                className="h-6 flex items-center cursor-pointer group touch-none px-3.5"
                onPointerDown={handlePointerDown}
                style={{ "--wails-draggable": "none" } as any}
            >
                <div 
                    ref={trackRef}
                    className="relative w-full h-1.5 bg-white/10 rounded-full overflow-visible transition-colors group-hover:bg-white/20"
                >
                    <div 
                        className="absolute top-0 left-0 h-full bg-pink-500 rounded-full pointer-events-none"
                        style={{ width: `${percentage}%` }}
                    />
                    
                    <div 
                        className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg shadow-black/50 pointer-events-none transition-transform duration-150 border border-black/10 ${isDragging ? 'scale-125 bg-pink-100 shadow-pink-500/50' : 'scale-100 group-hover:scale-110'}`}
                        style={{ left: `${percentage}%` }}
                    />
                </div>
            </div>
        </section>
    );
};

const NumberInputRow = ({ label, value, unit, onChange }: { label: string, value: number, unit: string, onChange: (val: number) => void }) => {
    const [localValue, setLocalValue] = useState(value.toString());

    useEffect(() => {
        setLocalValue(value.toString());
    }, [value]);

    const commitChange = () => {
        const num = parseInt(localValue, 10);
        if (!isNaN(num) && num > 0) {
            onChange(num);
        } else {
            setLocalValue(value.toString());
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            (e.target as HTMLInputElement).blur();
        }
    };

    return (
        <div className="flex justify-between items-center h-9">
            <span className="text-[11px] font-bold text-white/50 uppercase tracking-wider">{label}</span>
            <div className="flex items-center bg-white/5 rounded-md border border-white/5 hover:border-white/20 focus-within:border-pink-500/50 focus-within:bg-white/10 transition-all h-full">
                <input 
                    type="number"
                    value={localValue}
                    onChange={(e) => setLocalValue(e.target.value)}
                    onBlur={commitChange}
                    onKeyDown={handleKeyDown}
                    className="w-16 bg-transparent text-right text-xs font-mono text-white/90 outline-none h-full pl-2"
                    style={{ "--wails-draggable": "none" } as any}
                />
                <span className="text-[10px] text-white/30 font-bold px-2 pointer-events-none select-none">{unit}</span>
            </div>
        </div>
    );
};

export function SettingsPanel({ config, onChange, onClose }: SettingsPanelProps) {
    const handleChange = useCallback((key: keyof AppConfig, value: any) => {
        if (typeof value === 'number') {
            value = parseFloat(value.toFixed(2));
        }
        onChange({ ...config, [key]: value });
    }, [config, onChange]);

    return (
        <div className="flex flex-col h-full text-white/90 px-6 py-5 select-none animate-in fade-in duration-300 bg-black/40 backdrop-blur-md">
            <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-3 shrink-0">
                <h2 className="text-xs font-black tracking-[0.25em] text-pink-500 uppercase">Settings</h2>
                <button 
                    onClick={onClose} 
                    className="p-1.5 -mr-2 text-white/40 hover:text-white transition-colors"
                    style={{ "--wails-draggable": "none" } as any}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>

            <div 
                className="flex-1 space-y-8 overflow-y-auto pr-1 scrollbar-hide min-h-0"
                style={{ "--wails-draggable": "none" } as any}
            >
                <div className="space-y-6">
                    <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.15em]">Typography</div>
                    
                    <CustomSlider 
                        label="Font Size" 
                        value={config.fontSize} min={10} max={120} step={1} unit=" PT"
                        onChange={(v) => handleChange('fontSize', v)}
                    />

                    <CustomSlider 
                        label="Text Opacity" 
                        value={config.textOpacity} min={0.1} max={1} step={0.05}
                        displayFn={(v) => `${Math.round(v * 100)}%`}
                        onChange={(v) => handleChange('textOpacity', v)}
                    />
                </div>

                <div className="space-y-6">
                    <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.15em]">Appearance</div>
                    
                    <div className="grid grid-cols-2 gap-4">
                         <div 
                            className="bg-white/5 rounded-lg p-3 border border-white/5 flex flex-col gap-2.5 hover:bg-white/10 transition-colors" 
                            style={{ "--wails-draggable": "none" } as any}
                         >
                            <label className="text-[10px] font-bold text-white/50 uppercase">Fill Color</label>
                            <div className="flex items-center gap-3 relative h-8">
                                <input 
                                    type="color" 
                                    value={config.fontColor} 
                                    onChange={(e) => handleChange('fontColor', e.target.value)} 
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                                />
                                <div className="w-full h-full rounded shadow-sm ring-1 ring-white/10" style={{ backgroundColor: config.fontColor }} />
                            </div>
                         </div>
                         
                         <div 
                            className="bg-white/5 rounded-lg p-3 border border-white/5 flex flex-col gap-2.5 hover:bg-white/10 transition-colors" 
                            style={{ "--wails-draggable": "none" } as any}
                         >
                            <label className="text-[10px] font-bold text-white/50 uppercase">Glow Color</label>
                            <div className="flex items-center gap-3 relative h-8">
                                <input 
                                    type="color" 
                                    value={config.strokeColor} 
                                    onChange={(e) => handleChange('strokeColor', e.target.value)} 
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                                />
                                <div className="w-full h-full rounded shadow-sm ring-1 ring-white/10" style={{ backgroundColor: config.strokeColor }} />
                            </div>
                         </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.15em]">Window</div>

                    <NumberInputRow 
                        label="Window Width" 
                        value={config.windowWidth || 800} 
                        unit="PX"
                        onChange={(v) => handleChange('windowWidth', v)}
                    />

                    <CustomSlider 
                        label="Background Opacity" 
                        value={config.bgOpacity} min={0} max={1} step={0.05}
                        displayFn={(v) => `${Math.round(v * 100)}%`}
                        onChange={(v) => handleChange('bgOpacity', v)}
                    />
                </div>
            </div>

            <div className="mt-4 pt-4 border-t border-white/5 shrink-0">
                <button 
                    onClick={onClose}
                    className="w-full py-3 bg-pink-600 hover:bg-pink-500 text-white text-[11px] font-bold rounded-lg shadow-lg shadow-pink-900/40 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    style={{ "--wails-draggable": "none" } as any}
                >
                    <span>APPLY & CLOSE</span>
                </button>
            </div>
        </div>
    );
}