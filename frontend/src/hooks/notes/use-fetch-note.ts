import { useFetch } from "frontend/src/hooks/core/use-fetch";
import type { GetNotesResponseBody } from "shared/dto/note/body/get-notes-body.schema";

export function useFetchNote(noteId: string) {
	const { data, ...rest } = useFetch<GetNotesResponseBody[number]>(`http://localhost:3000/notes/${noteId}`);

	return { note: data, ...rest };
}
