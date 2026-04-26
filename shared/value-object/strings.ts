// title.schema.ts

import { z } from "zod";

export const TitleSchema = z
  .string()
  .trim()
  .min(1, "Title is required")
  .max(100, "Title must be at most 100 characters")
  .refine(
    (value) => !/[\r\n]/.test(value),
    "Title must be a single line without newlines"
  );
