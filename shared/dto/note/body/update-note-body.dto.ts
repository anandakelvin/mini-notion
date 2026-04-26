import { createZodDto } from "nestjs-zod";
import { TitleSchema } from "shared/value-object/strings";
import z from "zod";

export const UpdateNoteRequestBodySchema = z.object({
	title: TitleSchema,
});
export type UpdateNoteRequestBody = z.infer<typeof UpdateNoteRequestBodySchema>;
export class UpdateNoteRequestBodyDto extends createZodDto(UpdateNoteRequestBodySchema) {}
