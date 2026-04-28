import { createZodDto } from "nestjs-zod";
import { CreateNoteRequestBodySchema } from "shared/dto/note/body/create-note-body.schema";

export class CreateNoteRequestBodyDto extends createZodDto(CreateNoteRequestBodySchema) {}
