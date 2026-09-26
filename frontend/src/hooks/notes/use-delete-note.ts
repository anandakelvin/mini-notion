import { API_URL } from "frontend/src/lib/utils"
import { useFetch } from "frontend/src/hooks/core/use-fetch"

export function useDeleteNote(noteId: number) {
	return useFetch(`${API_URL}/notes/${noteId}`, {
		method: "DELETE",
		manual: true
	})
}