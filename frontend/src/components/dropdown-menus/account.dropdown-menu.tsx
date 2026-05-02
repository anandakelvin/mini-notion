import { LogOutAlertDialog } from "frontend/src/components/alert-dialogs/log-out.alert-dialog"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuTrigger
} from "frontend/src/components/ui/dropdown-menu"

export function AccountDropdownMenu({ children }: {
	children: React.ReactNode
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
				{children}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-40" align="start">
        <DropdownMenuGroup>
					<LogOutAlertDialog>
						<DropdownMenuItem onSelect={e => e.preventDefault()}>
            	Log Out
	          </DropdownMenuItem>
					</LogOutAlertDialog>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
