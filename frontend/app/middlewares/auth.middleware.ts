import { redirect } from "react-router"
import { useAppStore } from "~/stores/app.store"

export const authMiddleware = async ({ request }: any) => {
  let cookieHeader = ""
  if (typeof document !== "undefined") {
    cookieHeader = document.cookie
  } else {
    cookieHeader = request.headers.get("cookie") ?? ""
  }

  const cookies = Object.fromEntries(
    cookieHeader.split(";").filter(Boolean).map((c: string) => {
      const [k, v] = c.trim().split("=")
      return [k, v]
    }),
  )

  const accessToken = cookies["access_token"]
  const isAuthenticated = Boolean(accessToken)
  
  if(!isAuthenticated) {
    useAppStore.getState().setAuthStatus(false)
    throw redirect("/login");
  }

  useAppStore.getState().setAuthStatus(true)
}
