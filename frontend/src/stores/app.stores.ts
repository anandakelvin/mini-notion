// store/bearStore.ts
import { create } from 'zustand'

// 1. Define the shape of your store
type AppStore = {
  isAuthenticated: boolean
  setAuthStatus: (isAuthenticated: boolean) => void
}

// 2. Create a typed store
export const useAppStore = create<AppStore>((set) => ({
  isAuthenticated: false,
  setAuthStatus: (isAuthenticated: boolean) =>
    set(() => ({ isAuthenticated }))
}))
