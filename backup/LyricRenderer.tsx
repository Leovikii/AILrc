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
    const strokeColor = hexToRgba(config.strokeColor, config.textOpacity);

    return (
        <div 
            ref={ref}
            className="pointer-events-none flex flex-col items-center justify-center p-2 transition-all duration-200"
            style={{ 
                width: '100%',
                height: 'auto'
            }}
        >
            <div 
                className="font-bold leading-tight tracking-wide wrap-break-word whitespace-pre-wrap text-center"
                style={{ 
                    fontSize: `${config.fontSize}px`,
                    color: textColor,
                    WebkitTextStroke: `${config.strokeWidth}px ${strokeColor}`,
                    textShadow: `0px 2px 4px rgba(0,0,0,${config.textOpacity * 0.5})`,
                    fontFamily: '"Microsoft YaHei", sans-serif',
                    lineHeight: '1.2',
                    width: '100%'
                }}
            >
                {mainText}
            </div>

            {subText && (
                <div 
                    className="font-bold leading-tight tracking-wide wrap-break-word whitespace-pre-wrap text-center mt-1"
                    style={{ 
                        fontSize: `${Math.max(16, config.fontSize * 0.6)}px`,
                        color: textColor,
                        WebkitTextStroke: `${config.strokeWidth * 0.6}px ${strokeColor}`,
                        textShadow: `0px 2px 4px rgba(0,0,0,${config.textOpacity * 0.5})`,
                        fontFamily: '"Microsoft YaHei", sans-serif',
                        lineHeight: '1.2',
                        width: '100%',
                        opacity: 0.9 
                    }}
                >
                    {subText}
                </div>
            )}
        </div>
    );
});