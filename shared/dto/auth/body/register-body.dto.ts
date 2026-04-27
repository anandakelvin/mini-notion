import { createZodDto } from "nestjs-zod";
import { RegisterRequestBodySchema } from "shared/dto/auth/body/register-body.schema";

export class RegisterRequestBodyDto extends createZodDto(RegisterRequestBodySchema) {}
