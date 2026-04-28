import { Button } from '@/components/ui/button'
import { Item, ItemActions, ItemContent, ItemTitle } from '@/components/ui/item'
import { useAppStore } from '@/stores/app.stores'
import { type GetNotesResponseBody } from '@shared/dto/note/body/get-notes-body.schema'
import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

export const Route = createFileRoute('/notes')({
  component: RouteComponent,
})

function RouteComponent() {
  const setAuthStatus = useAppStore(state => state.setAuthStatus)
  const [notes, setNotes] = useState<GetNotesResponseBody>([])
  const [isFetchingNotes, setIsFetchingNotes] = useState(false)

  useEffect(() => {
    const abortController = new AbortController();
    const fetchNotes = async (abortController: AbortController) => {
      const response = await fetch("http://localhost:3000/notes", {
        signal: abortController.signal,
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      })

      if (response.ok) {
        setNotes(await response.json())
      } else if (response.status === 401) {
        setAuthStatus(false)
        return
      }
      setIsFetchingNotes(false)
    }
    
    if (isFetchingNotes) {
      fetchNotes(abortController)
    }
    return () => {
      abortController.abort()
    } 
  }, [isFetchingNotes])

  useEffect(() => {
    setIsFetchingNotes(true)
  }, [])

  return <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
    {
      isFetchingNotes ? (
        <p>Loading...</p>
      ) : (
        <>
        {notes.map((note) => (
          <Item key={note.id}>
            <ItemContent>
              <ItemTitle>{note.title}</ItemTitle>
            </ItemContent>
            <ItemActions>
              <Button>Action</Button>
            </ItemActions>
          </Item>
        ))}
        </>
      )
    }
  </div>
}
