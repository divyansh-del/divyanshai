
import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppSettings, Theme } from '../types';

// Default Settings (Fallback)
const DEFAULT_SETTINGS: AppSettings = {
    theme: 'Dark',
    layoutMode: 'Spacious',
    multitasking: false,
    general: {
        theme: 'System',
        accentColor: 'Blue',
        language: 'English',
        spokenLanguage: 'Auto-detect',
        voice: 'Kore'
    },
    notifications: {
        responses: true,
        tasks: 'Push, Email',
        groupChats: true,
        projects: false,
        recommendations: 'Push'
    },
    personalization: {
        baseStyle: 'Professional',
        custom_instructions: '',
        roast_mode: false, // Default OFF
        aboutUser: { nickname: '', occupation: '' },
        memory: { enabled: true, history: true },
        memories: []
    },
    security: {
        mfa: { authenticator: false, push: false, sms: false },
        active_sessions: []
    },
    parental: { restricted_mode: false, blocked_words: '', chat_time_limit: '' },
    data: { save_history: true, auto_delete_days: 30 },
    
    // NEW: God Mode Defaults
    brain: {
        creativity_level: 0.7,
        thinking_power: 'Balanced',
        memory_depth: 10,
        fact_check: false
    },
    voice_config: {
        speed: 1.0,
        silence_detection: 1200,
        emotion_level: 'Expressive',
        interrupt_sensitivity: 'Medium',
        voice_persona_prompt: '' // Default empty
    },
    developer: {
        debug_mode: false,
        show_tokens: false,
        raw_json_view: false,
        api_endpoint: 'Production',
        primary_provider: 'Gemini',
        openrouter_key: ''
    }
};

interface SettingsContextType {
    settings: AppSettings;
    updateSetting: (category: keyof AppSettings, key: string, value: any) => Promise<void>;
    resetSettings: () => void;
    isLoading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// USER ID for Demo (In real app, get from AuthContext)
const USER_ID = 'default_user';
// Use relative path to leverage Vite Proxy (fixes CORS and port issues)
const API_URL = '/api'; 
const VAPID_PUBLIC_KEY = 'YOUR_VAPID_PUBLIC_KEY'; // Replace with key from backend setup

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
    const [isLoading, setIsLoading] = useState(true);

    // 1. Initial Load (LocalStorage + API)
    useEffect(() => {
        const loadSettings = async () => {
            // A. Load from LocalStorage (Fast UI)
            const local = localStorage.getItem('chatbharat_settings');
            if (local) {
                try {
                    const parsed = JSON.parse(local);
                    // Deep merge defaults to ensure new fields (like primary_provider) exist
                    setSettings(prev => ({
                        ...prev,
                        ...parsed,
                        developer: { ...prev.developer, ...parsed.developer },
                        brain: { ...prev.brain, ...parsed.brain },
                        personalization: { ...prev.personalization, ...parsed.personalization },
                        voice_config: { ...prev.voice_config, ...parsed.voice_config }
                    }));
                } catch (e) {
                    console.error("Failed to parse local settings", e);
                }
            }

            // B. Load from Backend (Source of Truth)
            try {
                const res = await fetch(`${API_URL}/settings/${USER_ID}`);
                if (res.ok) {
                    const serverData = await res.json();
                    if (Object.keys(serverData).length > 0) {
                        setSettings(prev => ({
                            ...prev,
                            general: { ...prev.general, ...serverData.general },
                            notifications: { ...prev.notifications, ...serverData.notifications },
                            personalization: { ...prev.personalization, ...serverData.personalization },
                            security: { ...prev.security, ...serverData.security },
                            data: { ...prev.data, ...serverData.data_control },
                            parental: { ...prev.parental, ...serverData.parental },
                            apps: { ...prev.apps, ...serverData.apps },
                            brain: { ...prev.brain, ...serverData.brain },
                            voice_config: { ...prev.voice_config, ...serverData.voice_config },
                            developer: { ...prev.developer, ...serverData.developer }
                        }));
                    }
                } else {
                    console.log("Sync: Using local settings (Server responded " + res.status + ")");
                }
            } catch (e) {
                console.warn("Backend unavailable (Offline Mode). Settings will not sync to server.");
            } finally {
                setIsLoading(false);
            }
        };

        loadSettings();
    }, []);

    // 2. Side Effects
    useEffect(() => {
        // Apply Theme
        const applyTheme = () => {
            const isDark = settings.general?.theme === 'Dark' || 
                          (settings.general?.theme === 'System' && window.matchMedia('(prefers-color-scheme: dark)').matches);
            
            if (isDark) document.documentElement.classList.add('dark');
            else document.documentElement.classList.remove('dark');

            const colorMap: Record<string, string> = {
                'Blue': '#3b82f6',
                'Green': '#10a37f',
                'Purple': '#8b5cf6',
                'Orange': '#f97316'
            };
            const color = colorMap[settings.general?.accentColor || 'Blue'];
            document.documentElement.style.setProperty('--brand-color', color);
        };
        applyTheme();
    }, [settings.general]);

    // 3. Update Function
    const updateSetting = async (category: keyof AppSettings, key: string, value: any) => {
        setSettings(prev => {
            const newSettings = { ...prev };
            // @ts-ignore
            if (!newSettings[category]) newSettings[category] = {};
            
            if (category === 'theme' || category === 'layoutMode' || category === 'multitasking') {
                // @ts-ignore
                newSettings[category] = value;
            } else {
                // @ts-ignore
                newSettings[category] = { ...newSettings[category], [key]: value };
            }
            
            localStorage.setItem('chatbharat_settings', JSON.stringify(newSettings));
            return newSettings;
        });
        
        // Notifications Logic
        if (category === 'notifications' && key === 'push_enabled') {
            if (value === true) await subscribeToPush();
            else await unsubscribePush();
        }

        // Sync to Backend
        try {
            let backendCategory = category;
            if (category === 'data') backendCategory = 'data_control' as any;

            // @ts-ignore
            const payload = category === 'theme' ? { theme: value } : settings[category];
            const safePayload = typeof payload === 'object' ? { ...payload } : {};
            if (typeof payload === 'object') safePayload[key] = value;

            await fetch(`${API_URL}/settings/${USER_ID}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    category: backendCategory,
                    settings: safePayload
                })
            });
        } catch (e) {
            console.warn("Could not sync setting to server (Offline)");
        }
    };

    const resetSettings = () => {
        setSettings(DEFAULT_SETTINGS);
        localStorage.removeItem('chatbharat_settings');
    };

    const subscribeToPush = async () => {
        if (!('serviceWorker' in navigator)) return;
        try {
            const reg = await navigator.serviceWorker.ready;
            const sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlB64ToUint8Array(VAPID_PUBLIC_KEY)
            });
            await fetch(`${API_URL}/subscribe`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ user_id: USER_ID, subscription: sub })
            });
        } catch (e) { 
            console.warn("Push subscribe failed", e); 
        }
    };

    const unsubscribePush = async () => {
        if (!('serviceWorker' in navigator)) return;
        try {
            const reg = await navigator.serviceWorker.ready;
            const sub = await reg.pushManager.getSubscription();
            if (sub) {
                await sub.unsubscribe();
                await fetch(`${API_URL}/unsubscribe`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ user_id: USER_ID, endpoint: sub.endpoint })
                });
            }
        } catch (e) { console.warn("Push unsubscribe failed", e); }
    };

    const urlB64ToUint8Array = (base64String: string) => {
        try {
            const padding = '='.repeat((4 - base64String.length % 4) % 4);
            const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
            const rawData = window.atob(base64);
            const outputArray = new Uint8Array(rawData.length);
            for (let i = 0; i < rawData.length; ++i) {
                outputArray[i] = rawData.charCodeAt(i);
            }
            return outputArray;
        } catch (e) { return new Uint8Array(0); }
    };

    return (
        <SettingsContext.Provider value={{ settings, updateSetting, resetSettings, isLoading }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) throw new Error("useSettings must be used within SettingsProvider");
    return context;
};