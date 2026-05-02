import { useFetch } from "frontend/src/hooks/core/use-fetch"
import { type CreateNoteRequestBody } from "shared/dto/note/body/create-note-body.schema"

export function useCreateNote() {
	return useFetch<unknown, CreateNoteRequestBody>(
		`http://localhost:3000/notes`, 
		{
			method: "POST",
			manual: true,
		}
	)
}