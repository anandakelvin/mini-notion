import { IconCirclePlus, IconMenu2Filled, IconTrash } from '@tabler/icons-react'
import { createFileRoute } from '@tanstack/react-router'
import { RemoveNoteAlertDialog } from 'frontend/src/components/alert-dialogs/remove-note.alert-dialog'
import { CreateNoteDialog } from 'frontend/src/components/dialogs/create-note.dialog'
import { AccountDropdownMenu } from 'frontend/src/components/dropdown-menus/account.dropdown-menu'
import { Button } from 'frontend/src/components/ui/button'
import { ButtonGroup } from 'frontend/src/components/ui/button-group'
import { Item, ItemActions, ItemContent, ItemDescription, ItemTitle } from 'frontend/src/components/ui/item'
import { Skeletonizer } from 'frontend/src/components/ui/skeletonizer'
import { useFetchNotes } from 'frontend/src/hooks/notes/use-fetch-notes'
import { useAuthStore } from 'frontend/src/stores/auth.store'

export const Route = createFileRoute('/notes')({
  component: RouteComponent,
})

function RouteComponent() {
  const authenticated = useAuthStore(state => state.authenticated)
  const { notes, isLoading, execute: fetchNotes } = useFetchNotes();

  return (
    <div className="m-4 flex min-h-svh flex-col items-center justify-center gap-6 bg-background">
      {
      <div className='w-md flex flex-col gap-4'>
        <Item variant="outline">
          <ItemContent>
            <ItemTitle>{authenticated}</ItemTitle>
            <Skeletonizer enabled={isLoading}>
              <ItemDescription>
                You have {notes.length} notes.
              </ItemDescription>
            </Skeletonizer>
          </ItemContent>
          <ItemActions>
            <ButtonGroup>
              <CreateNoteDialog onSuccess={fetchNotes}>
                <Button variant="outline" size="sm">
                  <IconCirclePlus />
                  New Note
                </Button>
              </CreateNoteDialog>
              <AccountDropdownMenu>
                <Button variant="outline" size="sm" aria-label="More Options">
                  <IconMenu2Filled />
                </Button>
              </AccountDropdownMenu>
            </ButtonGroup>
          </ItemActions>
        </Item>

        { notes.length === 0 ? null :
        <div className='flex flex-col gap-2'>
          {notes.map((note) => (
            <Item key={note.id} variant='outline'>
              <ItemContent>
                <ItemTitle>{note.title}</ItemTitle>
              </ItemContent>
              <ItemActions>
                <RemoveNoteAlertDialog noteId={note.id} onSuccess={fetchNotes}>
                  <Button size='sm' variant='destructive'>
                    <IconTrash />
                  </Button>
                </RemoveNoteAlertDialog>
              </ItemActions>
            </Item>
          ))}
        </div>
        }
      </div>
      }
    </div>
  )
}
