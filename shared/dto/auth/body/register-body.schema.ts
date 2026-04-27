import z from "zod";

export const RegisterRequestBodySchema = z.object({
  email: z.email(),
  password: z.string().min(6),
});

export type RegisterRequestBody = z.infer<typeof RegisterRequestBodySchema>;