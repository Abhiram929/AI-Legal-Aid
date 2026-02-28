import { create } from 'zustand';

export type ThemeType =
    | 'default'
    | 'matrix'
    | 'alert'
    | 'galaxy'
    | 'neural'
    | 'quantum'
    | 'hologram'
    | 'antigravity'
    | 'cosmic';

interface ThemeState {
    theme: ThemeType;
    setTheme: (theme: ThemeType) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
    theme: 'default', // Initial default
    setTheme: (theme) => set({ theme }),
}));
