import { Outlet, createRootRoute, useNavigate } from '@tanstack/react-router';
import { useAuthStore } from 'frontend/src/stores/auth.store';
import { useEffect } from 'react';
import "../index.css";

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  const authenticated = useAuthStore(state => state.authenticated)
  const isChecking = useAuthStore(state => state.isChecking)
  const checkAuth = useAuthStore(state => state.check)
  const navigate = useNavigate()

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (!isChecking && !authenticated) {
      navigate({ to: "/auth", replace: true })
    }
  }, [authenticated, isChecking])


  if(isChecking) {
    return null
  }
  return <Outlet />;
}
