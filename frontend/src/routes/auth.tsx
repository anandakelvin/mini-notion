import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { LoginForm } from 'frontend/src/components/forms/login.form'
import { useAuthStore } from 'frontend/src/stores/auth.store'
import { useEffect } from 'react'

export const Route = createFileRoute('/auth')({
  component: RouteComponent,
})

function RouteComponent() {
	const authenticated = useAuthStore(state => state.authenticated)
	const navigate = useNavigate()
  
  useEffect(() => {
    if (authenticated) {
      navigate({ to: "/notes", replace: true })
    }
  }, [authenticated])

	return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  )
}

