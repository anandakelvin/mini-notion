import { createZodDto } from "nestjs-zod";
import { GetNotesResponseBodySchema } from "shared/dto/note/body/get-notes-body.schema";

export class GetNotesResponseBodyDto extends createZodDto(GetNotesResponseBodySchema) {}
