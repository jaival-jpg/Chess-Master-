import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Difficulty = 'Easy' | 'Medium' | 'Hard';
export type BoardTheme = 'Light' | 'Dark' | 'Wooden';

export interface GameSettings {
  sound: boolean;
  vibration: boolean;
  language: string;
  boardTheme: BoardTheme;
  difficulty: Difficulty;
  removeAds: boolean;
}

export interface User {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  coins: number;
}

interface GameState {
  coins: number;
  settings: GameSettings;
  user: User | null;
  isAuthReady: boolean;
  addCoins: (amount: number) => void;
  removeCoins: (amount: number) => void;
  updateSettings: (settings: Partial<GameSettings>) => void;
  setUser: (user: User | null) => void;
  setAuthReady: (ready: boolean) => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      coins: 500,
      settings: {
        sound: true,
        vibration: true,
        language: 'English',
        boardTheme: 'Wooden',
        difficulty: 'Medium',
        removeAds: false,
      },
      user: null,
      isAuthReady: false,
      addCoins: (amount) => set((state) => ({ coins: state.coins + amount })),
      removeCoins: (amount) => set((state) => ({ coins: Math.max(0, state.coins - amount) })),
      updateSettings: (newSettings) =>
        set((state) => ({ settings: { ...state.settings, ...newSettings } })),
      setUser: (user) => set({ user }),
      setAuthReady: (ready) => set({ isAuthReady: ready }),
    }),
    {
      name: 'chess-master-storage',
      partialize: (state) => ({ settings: state.settings, coins: state.coins }),
    }
  )
);
