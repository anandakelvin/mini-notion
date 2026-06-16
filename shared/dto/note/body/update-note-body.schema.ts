import { TitleSchema } from "shared/value-object/strings";
import z from "zod";


export const UpdateNoteRequestBodySchema = z.object({
	title: TitleSchema,
	content: z.any().optional(),
	updatedAt: z.string().or(z.date()).optional(),
});
export type UpdateNoteRequestBody = z.infer<typeof UpdateNoteRequestBodySchema>;