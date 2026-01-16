import { useState, useEffect } from 'react';
import { GetConfig, SaveConfig } from "../../wailsjs/go/main/App";
import { AppConfig } from "../types";

const defaultConfig: AppConfig = {
    fontSize: 48,
    fontColor: "#FFFFFF",
    strokeColor: "#000000",
    bgOpacity: 0.6,
    textOpacity: 1.0,
    windowWidth: 800
};

export function useConfig() {
    const [config, setConfig] = useState<AppConfig>(defaultConfig);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        GetConfig().then(cfg => {
            if (cfg) {
                setConfig(prev => ({ ...prev, ...cfg }));
            }
            setIsLoaded(true);
        }).catch(() => {
            setIsLoaded(true);
        });
    }, []);

    const save = (newConfig: AppConfig) => {
        setConfig(newConfig);
        SaveConfig(newConfig as any);
    };

    return { config, setConfig, save, isLoaded };
}