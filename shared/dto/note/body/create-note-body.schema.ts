import { TitleSchema } from "shared/value-object/strings";
import z from "zod";

export const CreateNoteRequestBodySchema = z.object({
	title: TitleSchema,
});
export type CreateNoteRequestBody = z.infer<typeof CreateNoteRequestBodySchema>;