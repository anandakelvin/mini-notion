import { createZodDto } from "nestjs-zod";
import { UpdateNoteRequestBodySchema } from "shared/dto/note/body/update-note-body.schema";

export class UpdateNoteRequestBodyDto extends createZodDto(UpdateNoteRequestBodySchema) {}
