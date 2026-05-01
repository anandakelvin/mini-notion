import { useFetch } from "frontend/src/hooks/core/use-fetch"

export function useDeleteNote(noteId: number) {
	return useFetch(`http://localhost:3000/notes/${noteId}`, {
		method: "DELETE",
		manual: true
	})
}