import { LayoutBottomIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import React, { useState } from "react"
import { useNavigate } from "react-router"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "~/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel
} from "~/components/ui/field"
import { Input } from "~/components/ui/input"
import { cn } from "~/lib/utils"
import { LoginRequestBodySchema, type LoginRequestBody } from "shared/dto/auth/body/login-body.schema"
import { RegisterRequestBodySchema } from "shared/dto/auth/body/register-body.schema"

type AuthMode = "login" | "register"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [mode, setMode] = useState<AuthMode>("login")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LoginRequestBody>({
    resolver: zodResolver(mode === "login" ? LoginRequestBodySchema : RegisterRequestBodySchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const onSubmit = async (data: LoginRequestBody) => {
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
        body: JSON.stringify(data),
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
        reset()
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const toggleMode = () => {
    const newMode = mode === "login" ? "register" : "login"
    setMode(newMode)
    setError(null)
    reset()
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form onSubmit={handleSubmit(onSubmit)}>
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
                    onClick={toggleMode}
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
                    onClick={toggleMode}
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
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  aria-invalid={!!errors.email}
                />
              )}
            />
            {errors.email && (
              <FieldDescription className="text-destructive text-xs">
                {errors.email.message}
              </FieldDescription>
            )}
          </Field>
          
          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  aria-invalid={!!errors.password}
                />
              )}
            />
            {errors.password && (
              <FieldDescription className="text-destructive text-xs">
                {errors.password.message}
              </FieldDescription>
            )}
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
