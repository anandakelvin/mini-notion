import { LayoutBottomIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import React, { useState } from "react"
import { useNavigate } from "react-router"
import { Button } from "~/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel
} from "~/components/ui/field"
import { Input } from "~/components/ui/input"
import { cn } from "~/lib/utils"

type AuthMode = "login" | "register"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [mode, setMode] = useState<AuthMode>("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const endpoint = mode === "login" ? "/auth/login" : "/auth/register"
    
    try {
      const response = await fetch(`http://localhost:3000${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || `Failed to ${mode}`)
      }

      if (mode === "login") {
        navigate("/")
      } else {
        setMode("login")
        setError("Account created! Please log in.")
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form onSubmit={handleSubmit}>
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <a
              href="/"
              className="flex flex-col items-center gap-2 font-medium"
            >
              <div className="flex size-8 items-center justify-center rounded-md">
                <HugeiconsIcon icon={LayoutBottomIcon} strokeWidth={2} className="size-6" />
              </div>
              <span className="sr-only">Mini Notion.</span>
            </a>
            <h1 className="text-xl font-bold">
              {mode === "login" ? "Welcome to Mini Notion." : "Create an account."}
            </h1>
            <FieldDescription>
              {mode === "login" ? (
                <>
                  Don&apos;t have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("register")}
                    className="underline underline-offset-4"
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("login")}
                    className="underline underline-offset-4"
                  >
                    Login
                  </button>
                </>
              )}
            </FieldDescription>
          </div>

          {error && (
            <div className={cn(
              "p-3 rounded-md text-sm",
              error.includes("Account created") ? "bg-green-100 text-green-700" : "bg-destructive/10 text-destructive"
            )}>
              {error}
            </div>
          )}

          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Field>
          
          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Field>

          <Field>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Please wait..." : mode === "login" ? "Login" : "Register"}
            </Button>
          </Field>
          
        </FieldGroup>
      </form>
      <FieldDescription className="px-6 text-center">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </FieldDescription>
    </div>
  )
}
