import z from "zod";

export const RegisterRequestBodyDto = z.object({
  email: z.email(),
  password: z.string().min(6),
});

export type RegisterRequestBodyDto = z.infer<typeof RegisterRequestBodyDto>;