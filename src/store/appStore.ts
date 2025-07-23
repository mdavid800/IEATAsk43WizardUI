import { create } from 'zustand';

interface AppState {
  // UI State
  showForm: boolean;
  
  // Actions
  setShowForm: (show: boolean) => void;
  startForm: () => void;
  backToLanding: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Initial state
  showForm: false,
  
  // Actions
  setShowForm: (show: boolean) => set({ showForm: show }),
  startForm: () => set({ showForm: true }),
  backToLanding: () => set({ showForm: false }),
}));