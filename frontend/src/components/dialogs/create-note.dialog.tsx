import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "frontend/src/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "frontend/src/components/ui/dialog"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "frontend/src/components/ui/field"
import { Input } from "frontend/src/components/ui/input"
import { useCreateNote } from "frontend/src/hooks/notes/use-create-note"
import { useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { CreateNoteRequestBodySchema, type CreateNoteRequestBody } from "shared/dto/note/body/create-note-body.schema"
import { toast } from "sonner"

export function CreateNoteDialog({ onSuccess, children }: {
  children: React.ReactNode, onSuccess?: () => void
}) {

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateNoteRequestBody>({
    resolver: zodResolver(CreateNoteRequestBodySchema),
    defaultValues: {
      title: "",
    },
  })
  const {
    execute: createNote,
    isLoading: isCreating,
    error: createNoteError
  } = useCreateNote()
  const [open, setOpen] = useState(false)
  
  useEffect(() => {
    if(createNoteError) {
      toast.error(createNoteError.message)
    }
  }, [createNoteError])

  function onSubmit(data: CreateNoteRequestBody) {
    createNote(data).then(
      () => {
        setOpen(false)
        onSuccess?.()
      }
    )
  }

  function onCancel() {
    setOpen(false)
    reset()
  }
    
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            <DialogHeader>
              <DialogTitle>Create Note</DialogTitle>
              <DialogDescription>
                Create a new note by filling in the fields below
              </DialogDescription>
            </DialogHeader>
            <Field>
              <FieldLabel htmlFor="title">Title</FieldLabel>
              <Controller
                name="title"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="title"
                    type="text"
                    placeholder="A title of a note..."
                    aria-invalid={!!errors.title}
                  />
                )}
              />
              {errors.title && (
                <FieldDescription className="text-destructive text-xs">
                  {errors.title.message}
                </FieldDescription>
              )}
            </Field>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={isCreating}
                onClick={onCancel}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isCreating}
              >
                {isCreating ? "Creating..." : "Create Note"}
              </Button>
            </DialogFooter>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  )
}
