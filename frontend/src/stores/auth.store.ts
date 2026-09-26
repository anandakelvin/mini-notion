import { API_URL } from "frontend/src/lib/utils"
// store/bearStore.ts
import { create } from 'zustand'

// 1. Define the shape of your store
type AuthStore = {
  authenticated: string | null
  isChecking: boolean
  check: () => Promise<void>
  reset: () => void
}

// 2. Create a typed store
export const useAuthStore = create<AuthStore>((set) => ({
  authenticated: null,
  isChecking: true,
  check: async () => {
    set({ isChecking: true })
    const response = await fetch(
      `${API_URL}/api/auth/check`, {
        credentials: 'include',
      },
    )
    if(response.ok) {
      const data = await response.text()
      set({ authenticated: data })
    } else {
      set({ authenticated: null})
    }
    set({ isChecking: false })
  },
  reset: () => {
    set({authenticated: null, isChecking: false})
  }
}))
