import { useAppStore } from '@/stores/app.stores'
import { Outlet, createRootRoute, useNavigate } from '@tanstack/react-router'
import * as React from 'react'
import "../index.css"

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  const navigator = useNavigate()
  const { isAuthenticated } = useAppStore()
  const setAuthStatus = useAppStore(state => state.setAuthStatus)

  React.useEffect(() => {
    const checkAuth = async () => {
      const response = await fetch("http://localhost:3000/auth/check", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      })

      if (response.ok) {
        setAuthStatus(true)
      }
    }
    checkAuth()
  }, [])

  React.useEffect(()=>{
    if (!isAuthenticated) {
      navigator({ to: "/auth" })
      return
    } 
    navigator({ to: "/notes" })
  }, [isAuthenticated])

  return (
    <React.Fragment>
      <Outlet />
    </React.Fragment>
  )
}
