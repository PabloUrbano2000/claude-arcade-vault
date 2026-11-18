import "server-only";
import type { ContactInput } from "@/lib/contact-schema";

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/** Escapes user input so it is rendered as literal text inside the HTML email. */
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => HTML_ESCAPES[ch]);
}

/** Collapses line breaks so user input cannot inject extra lines into a header. */
function singleLine(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}

/** Builds the email the team receives for a contact form message. */
export function buildContactEmail(input: ContactInput): {
  subject: string;
  html: string;
  text: string;
} {
  const name = singleLine(input.name);
  const email = singleLine(input.email);

  const subject = `[Arcade Vault] Mensaje de ${name}`;

  const text = [
    "Nuevo mensaje desde el formulario de contacto de Arcade Vault.",
    "",
    `Nombre: ${name}`,
    `Correo: ${email}`,
    "",
    "Mensaje:",
    input.msg,
  ].join("\n");

  const html = `<!doctype html>
<html lang="es">
  <body style="margin:0;padding:24px;background:#0a0a0f;color:#e6e9ff;font-family:'Courier New',monospace;">
    <div style="max-width:600px;margin:0 auto;border:1px solid rgba(0,245,255,0.3);background:#0f0f18;padding:24px;">
      <p style="margin:0 0 16px;color:#00f5ff;font-size:12px;letter-spacing:2px;">ARCADE VAULT // CONTACTO</p>
      <p style="margin:0 0 6px;"><strong style="color:#8a8fb5;">NOMBRE:</strong> ${escapeHtml(name)}</p>
      <p style="margin:0 0 18px;"><strong style="color:#8a8fb5;">CORREO:</strong> ${escapeHtml(email)}</p>
      <p style="margin:0 0 8px;color:#8a8fb5;"><strong>MENSAJE:</strong></p>
      <div style="white-space:pre-wrap;line-height:1.6;border-left:3px solid #ff006e;padding-left:12px;">${escapeHtml(input.msg)}</div>
    </div>
  </body>
</html>`;

  return { subject, html, text };
}
