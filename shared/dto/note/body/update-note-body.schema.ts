import { TitleSchema } from "shared/value-object/strings";
import z from "zod";


export const UpdateNoteRequestBodySchema = z.object({
	title: TitleSchema,
});
export type UpdateNoteRequestBody = z.infer<typeof UpdateNoteRequestBodySchema>;