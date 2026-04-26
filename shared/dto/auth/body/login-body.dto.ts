import { createZodDto } from "nestjs-zod";
import z from "zod";

export const LoginRequestBodySchema = z.object({
	email: z.email(),
	password: z.string().min(6),
});
export type LoginRequestBody = z.infer<typeof LoginRequestBodySchema>;	
export class LoginRequestBodyDto extends createZodDto(LoginRequestBodySchema) {}

export const LoginResponseBodySchema = z.object({
	access_token: z.string(),
});
export type LoginResponseBody = z.infer<typeof LoginResponseBodySchema>;
export class LoginResponseBodyDto extends createZodDto(LoginResponseBodySchema) {}