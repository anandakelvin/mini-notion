import { useFetch } from "frontend/src/hooks/core/use-fetch";
import type { GetNotesResponseBody } from "shared/dto/note/body/get-notes-body.schema";

export function useFetchNotes() {
	const {data, ...rest} = useFetch<GetNotesResponseBody>("http://localhost:3000/notes")

	return {notes: data === null ? [] : data, ...rest}
}