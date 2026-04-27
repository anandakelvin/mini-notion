import { createZodDto } from "nestjs-zod";
import { LoginRequestBodySchema, LoginResponseBodySchema } from "shared/dto/auth/body/login-body.schema";

export class LoginRequestBodyDto extends createZodDto(LoginRequestBodySchema) {}

export class LoginResponseBodyDto extends createZodDto(LoginResponseBodySchema) {}