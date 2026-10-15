import { z } from "zod";
import type { Field } from "@/types";
export function validateFields(fields: Field[], values: Record<string, unknown>) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const f of fields) {
    if (f.type === "checkbox") shape[f.key] = z.boolean().optional();
    else if (f.type === "number")
      shape[f.key] = z.coerce.number().min(0, "Must be zero or greater").max(100000000);
    else if (f.type === "email")
      shape[f.key] = f.required
        ? z.string().trim().email("Enter a valid email").max(255)
        : z
            .union([z.literal(""), z.string().trim().email("Enter a valid email").max(255)])
            .optional();
    else
      shape[f.key] = f.required
        ? z
            .string()
            .trim()
            .min(1, `${f.label} is required`)
            .max(f.type === "textarea" ? 10000 : 255)
        : z
            .string()
            .max(f.type === "textarea" ? 10000 : 255)
            .optional();
  }
  return z.object(shape).safeParse(values);
}
export const replySchema = z
  .object({ admin_reply: z.string().max(10000).optional(), email: z.string().optional() })
  .superRefine((v, ctx) => {
    if (v.admin_reply?.trim() && !z.string().email().safeParse(v.email).success)
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["email"],
        message: "A valid email is required to send a reply.",
      });
  });
