import { z } from "zod";

/**
 * Contact form schema, shared by the Server Action (authoritative validation)
 * and the client form (field limits for native validation).
 */
export const CONTACT_LIMITS = {
  name: { max: 50 },
  email: { max: 254 },
  msg: { min: 10, max: 2000 },
} as const;

export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "ESCRIBE TU NOMBRE")
    .max(CONTACT_LIMITS.name.max, `MÁXIMO ${CONTACT_LIMITS.name.max} CARACTERES`),
  // Zod 4: `z.email()` replaces the deprecated `z.string().email()`. Trim runs first.
  email: z
    .string()
    .trim()
    .max(CONTACT_LIMITS.email.max, "CORREO DEMASIADO LARGO")
    .pipe(z.email("CORREO NO VÁLIDO")),
  msg: z
    .string()
    .trim()
    .min(CONTACT_LIMITS.msg.min, `MÍNIMO ${CONTACT_LIMITS.msg.min} CARACTERES`)
    .max(CONTACT_LIMITS.msg.max, `MÁXIMO ${CONTACT_LIMITS.msg.max} CARACTERES`),
});

export type ContactInput = z.infer<typeof contactSchema>;

export type ContactField = keyof ContactInput; // "name" | "email" | "msg"

export type ContactState =
  | { status: "idle" }
  | { status: "invalid"; values: ContactInput; errors: Partial<Record<ContactField, string>> }
  | { status: "sent"; name: string }
  | { status: "failed"; values: ContactInput };
