import { API_URL } from "frontend/src/lib/utils"
import { useFetch } from "frontend/src/hooks/core/use-fetch"
import { type CreateNoteRequestBody } from "shared/dto/note/body/create-note-body.schema"

export function useCreateNote() {
	return useFetch<unknown, CreateNoteRequestBody>(
		`${API_URL}/notes`, 
		{
			method: "POST",
			manual: true,
		}
	)
}