import { IconTrash } from "@tabler/icons-react"
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
import { useDeleteNote } from "frontend/src/hooks/notes/use-delete-note"
import { useEffect, useState } from "react"
import { toast } from "sonner"

export function RemoveNoteAlertDialog({ noteId, onSuccess, children }: {
  children: React.ReactNode, noteId: number, onSuccess?: () => void
}) {
  const {
    execute: deleteNote,
    isLoading: isDeleting,
    error: deleteNoteError
  } = useDeleteNote(noteId)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if(deleteNoteError) {
      toast.error(deleteNoteError.message)
    }
  }, [deleteNoteError])

  function onSubmit() {
    deleteNote().then(
      () => {
        setOpen(false)
        onSuccess?.()
      }
    )
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        {children}
      </AlertDialogTrigger>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive">
            <IconTrash />
          </AlertDialogMedia>
          <AlertDialogTitle>Delete note?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the selected note.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button
            variant="outline"
            disabled={isDeleting}
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={isDeleting}
            onClick={onSubmit}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
