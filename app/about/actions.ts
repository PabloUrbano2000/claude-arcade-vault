"use server";

import { Resend } from "resend";
import { buildContactEmail } from "@/lib/contact-email";
import {
  contactSchema,
  type ContactField,
  type ContactInput,
  type ContactState,
} from "@/lib/contact-schema";

const DEFAULT_FROM = "Arcade Vault <onboarding@resend.dev>";

function readField(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

/**
 * Contact form Server Action (SPEC 03).
 * Order: honeypot → Zod validation → env config → send via Resend.
 * Never throws: every outcome is mapped to a ContactState the form can render.
 */
export async function sendContactMessage(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  // Raw values are echoed back on errors so the form keeps what the user typed.
  const values: ContactInput = {
    name: readField(formData, "name"),
    email: readField(formData, "email"),
    msg: readField(formData, "msg"),
  };

  // Honeypot: real users never see the `website` field. Pretend success, send nothing.
  if (readField(formData, "website").trim() !== "") {
    return { status: "sent", name: values.name.trim() || "JUGADOR" };
  }

  const parsed = contactSchema.safeParse(values);
  if (!parsed.success) {
    const errors: Partial<Record<ContactField, string>> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as ContactField;
      errors[field] ??= issue.message; // first message per field
    }
    return { status: "invalid", values, errors };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  const from = process.env.CONTACT_FROM_EMAIL || DEFAULT_FROM;
  if (!apiKey || !to) {
    console.error(
      "[contact] Missing configuration:",
      [!apiKey && "RESEND_API_KEY", !to && "CONTACT_TO_EMAIL"].filter(Boolean).join(", "),
    );
    return { status: "failed", values };
  }

  const { subject, html, text } = buildContactEmail(parsed.data);

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to,
      replyTo: parsed.data.email,
      subject,
      html,
      text,
    });
    if (error) {
      console.error("[contact] Resend error:", error.name, error.message);
      return { status: "failed", values };
    }
  } catch (err) {
    console.error("[contact] Unexpected error sending email:", err);
    return { status: "failed", values };
  }

  return { status: "sent", name: parsed.data.name };
}
