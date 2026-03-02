import { create } from 'zustand';

interface GemDetailState {
  selectedGemId: string | null;
  setSelectedGemId: (id: string | null) => void;
}

export const useGemDetailStore = create<GemDetailState>((set) => ({
  selectedGemId: null,
  setSelectedGemId: (selectedGemId) => set({ selectedGemId }),
}));
