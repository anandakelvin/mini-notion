import { API_URL } from "frontend/src/lib/utils"
import { useFetch } from "frontend/src/hooks/core/use-fetch";
import type { UpdateNoteRequestBody } from "shared/dto/note/body/update-note-body.schema";
import type { GetNotesResponseBody } from "shared/dto/note/body/get-notes-body.schema";

export function useUpdateNote(noteId: string) {
	const { execute, ...rest } = useFetch<GetNotesResponseBody[number], UpdateNoteRequestBody>(
		`${API_URL}/api/notes/${noteId}`,
		{
			method: "PUT",
			manual: true,
		}
	);

	return { updateNote: execute, ...rest };
}
