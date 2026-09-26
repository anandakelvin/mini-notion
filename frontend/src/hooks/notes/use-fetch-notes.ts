import { API_URL } from "frontend/src/lib/utils"
import { useFetch } from "frontend/src/hooks/core/use-fetch";
import type { GetNotesResponseBody } from "shared/dto/note/body/get-notes-body.schema";

export function useFetchNotes() {
	const {data, ...rest} = useFetch<GetNotesResponseBody>(`${API_URL}/notes`)

	return {notes: data === null ? [] : data, ...rest}
}