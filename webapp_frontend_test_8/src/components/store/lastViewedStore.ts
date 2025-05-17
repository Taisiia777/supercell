// @ts-nocheck
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface LastViewedState {
  lastViewedProductId: number | null;
  setLastViewedProduct: (id: number) => void;
  clearLastViewedProduct: () => void;
}

export const useLastViewedStore = create<LastViewedState>(
  persist(
    (set) => ({
      lastViewedProductId: null,
      setLastViewedProduct: (id) => set({ lastViewedProductId: id }),
      clearLastViewedProduct: () => set({ lastViewedProductId: null }),
    }),
    {
      name: 'last-viewed-product',
      getStorage: () => localStorage,
    }
  )
);