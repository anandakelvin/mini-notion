import { TitleSchema } from "shared/value-object/strings";
import z from "zod";

const NoteBody = z.object({
	id: z.number(),
	title: TitleSchema,
	content: z.any().optional(),
	user_id: z.number(),
	last_edited_by: z.string().nullable().optional(),
	created_at: z.date(),
	updated_at: z.date(),
});

export const GetNotesResponseBodySchema = z.array(NoteBody);
export type GetNotesResponseBody = z.infer<typeof GetNotesResponseBodySchema>;
