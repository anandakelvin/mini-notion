import { IconCirclePlus } from '@tabler/icons-react'
import { createFileRoute } from '@tanstack/react-router'
import { Skeletonizer } from 'frontend/src/components/skeletonizer/skeletonizer'
import { Button } from 'frontend/src/components/ui/button'
import { Item, ItemActions, ItemContent, ItemDescription, ItemTitle } from 'frontend/src/components/ui/item'
import { useFetchNotes } from 'frontend/src/hooks/notes/use-fetch-notes'
import { useAuthStore } from 'frontend/src/stores/auth.store'

export const Route = createFileRoute('/notes')({
  component: RouteComponent,
})

function RouteComponent() {
  const authenticated = useAuthStore(state => state.authenticated)
  const { notes, isLoading } = useFetchNotes();

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background">
      {
      <div className='w-[500px] flex flex-col gap-4'>
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
            <Button variant="outline" size="sm">
              <IconCirclePlus />
              New Note
            </Button>
          </ItemActions>
        </Item>

        { notes.length === 0 ? null :
        <div className='w-[500px] flex flex-col gap-2'>
          {notes.map((note) => (
            <Item key={note.id} variant='outline'>
              <ItemContent>
                <ItemTitle>{note.title}</ItemTitle>
              </ItemContent>
              <ItemActions>
                <Button>Action</Button>
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
