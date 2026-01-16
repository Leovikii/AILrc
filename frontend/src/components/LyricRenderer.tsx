import { forwardRef } from 'react';
import { AppConfig } from "../types";
import { hexToRgba } from "../utils/color";

interface LyricRendererProps {
    mainText: string;
    subText: string;
    config: AppConfig;
}

export const LyricRenderer = forwardRef<HTMLDivElement, LyricRendererProps>(({ mainText, subText, config }, ref) => {
    const textColor = hexToRgba(config.fontColor, config.textOpacity);
    const glowColor = hexToRgba(config.strokeColor, config.textOpacity * 0.6);
    const deepShadow = hexToRgba(config.strokeColor, config.textOpacity * 0.9);

    return (
        <div 
            ref={ref}
            className="pointer-events-none flex flex-col items-center justify-center p-2 w-full h-auto"
        >
            <div 
                className="leading-tight tracking-wide wrap-break-word whitespace-pre-wrap text-center"
                style={{ 
                    fontSize: `${config.fontSize}px`,
                    fontWeight: 800,
                    color: textColor,
                    textShadow: `0 0 1px ${deepShadow}, 0 2px 4px ${glowColor}, 0 0 10px ${glowColor}`,
                    fontFamily: '"Microsoft YaHei", sans-serif',
                    lineHeight: '1.2',
                    width: '100%'
                }}
            >
                {mainText}
            </div>

            {subText && (
                <div 
                    className="leading-tight tracking-wide wrap-break-word whitespace-pre-wrap text-center mt-1.5"
                    style={{ 
                        fontSize: `${Math.max(14, config.fontSize * 0.55)}px`,
                        fontWeight: 500,
                        color: textColor,
                        textShadow: `0 1px 2px ${deepShadow}`,
                        fontFamily: '"Microsoft YaHei", sans-serif',
                        lineHeight: '1.3',
                        width: '100%',
                        opacity: 0.85
                    }}
                >
                    {subText}
                </div>
            )}
        </div>
    );
});