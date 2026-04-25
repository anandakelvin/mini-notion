import z from "zod";

export const LoginRequestBodyDto = z.object({
	email: z.email(),
	password: z.string().min(6),
});

export type LoginRequestBodyDto = z.infer<typeof LoginRequestBodyDto>;	

export const LoginResponseBodyDto = z.object({
	access_token: z.string(),
});

export type LoginResponseBodyDto = z.infer<typeof LoginResponseBodyDto>;