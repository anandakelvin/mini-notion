import { IconLogout2 } from "@tabler/icons-react"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger
} from "frontend/src/components/ui/alert-dialog"
import { Button } from "frontend/src/components/ui/button"
import { useLogOut } from "frontend/src/hooks/auth/use-log-out"
import { useAuthStore } from "frontend/src/stores/auth.store"
import { useEffect, useState } from "react"
import { toast } from "sonner"

export function LogOutAlertDialog({ children }: {
  children: React.ReactNode
}) {
	const resetAuth = useAuthStore(state => state.reset)
  const [open, setOpen] = useState(false)

	const { execute: logOut, isLoading: isLoggingOut, error: logOutError } = useLogOut()

  useEffect(() => {
    if(logOutError) {
      toast.error(logOutError.message)
    }
  }, [logOutError])

  function onSubmit() {
    logOut().then(resetAuth)
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        {children}
      </AlertDialogTrigger>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogMedia className="text-default dark:text-default">
            <IconLogout2 />
          </AlertDialogMedia>
          <AlertDialogTitle>Logout from Mini Notion?</AlertDialogTitle>
          <AlertDialogDescription>
            You may log in later to continue using Mini Notion.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
					  disabled={isLoggingOut}
          >
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={onSubmit}
					  disabled={isLoggingOut}
          >
						{isLoggingOut ? "Logging out..." : "Log Out"} 
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
