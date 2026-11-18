# SPEC 03 — Página About y formulario de contacto con Resend

> **Estado:** Implementado
> **Depende de:** SPEC 01, SPEC 02
> **Fecha:** 2026-11-18
> **Objetivo:** Agregar la página `/about` de `references/templates/home-about/about.jsx` con fidelidad visual, y que su formulario de contacto envíe un correo real al equipo con Resend mediante una Server Action.

---

## Por qué existe esta spec

La `SPEC 02` portó la landing y dejó fuera la pantalla About y el enlace «Acerca de» del nav para no tener enlaces rotos. En la referencia, el formulario de contacto es simulado: valida que los campos no estén vacíos y muestra la terminal de éxito sin enviar nada. Esta spec porta la pantalla y conecta el formulario a un envío real con Resend. Para eso agrega dos estados que la plantilla no tiene: carga y error.

---

## Alcance

**Dentro:**

- Nueva ruta `/about` con las secciones de `about.jsx`, en este orden:
  - Hero: kicker «▸ ACERCA DE», título «ACERCA DE ARCADE VAULT», texto de misión y 3 highlights con icono pixel (HEART magenta, BROWSER cyan, PLANT green).
  - Divisor animado (`.about-divider`, 24 píxeles con `animationDelay` escalonado).
  - Contacto: intro (kicker «▸ CONTACTO», «CONTÁCTANOS», subtítulo y 3 tips con LED) y formulario (NOMBRE, CORREO ELECTRÓNICO, MENSAJE, botón «▶  ENVIAR MENSAJE»).
- Animación `.reveal` al hacer scroll, reutilizando `components/home/reveal-observer.tsx` de la `SPEC 02` (incluye respeto de `prefers-reduced-motion`).
- Página como Server Component. Solo el formulario es cliente.
- Nav: enlace «Acerca de» (`/about`) después de «Salón de la Fama», en la barra y en el panel móvil, con estado activo en `/about`.
- Envío real del formulario:
  - Server Action `sendContactMessage` en `app/about/actions.ts` con `useActionState` en el cliente.
  - Validación en el servidor con Zod. Validación nativa en el cliente (`required`, `type="email"`, `maxLength`).
  - Correo enviado con el SDK `resend` a `CONTACT_TO_EMAIL`, desde `CONTACT_FROM_EMAIL`, con `replyTo` = correo del usuario.
  - Asunto: `[Arcade Vault] Mensaje de {nombre}`. Cuerpo en HTML y en texto plano, generado por `lib/contact-email.ts`, con escape de HTML de los datos del usuario.
  - Honeypot: campo oculto `website`. Si llega con contenido, la acción responde éxito sin enviar.
- Estados del formulario:
  - **Inicial:** igual que la plantilla.
  - **Enviando:** botón deshabilitado con el texto «▶  TRANSMITIENDO…». Campos deshabilitados.
  - **Error de validación:** shake de la plantilla y un texto pequeño en rojo bajo cada campo inválido. Se conservan los valores escritos.
  - **Éxito:** terminal de la plantilla con «GRACIAS, {NOMBRE}.» y el botón «ENVIAR OTRO MENSAJE», que vuelve al formulario vacío.
  - **Error de envío** (Resend falla o falta configuración): la misma terminal con `[OK] Conectando con servidor…`, `[OK] Validando contenido…` y luego `[ERR] TRANSMISIÓN FALLIDA. INTÉNTALO DE NUEVO MÁS TARDE.` en rojo, con el botón «REINTENTAR», que vuelve al formulario con los datos conservados.
- Variables de entorno (`RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`) documentadas en `.env.example`, que se versiona.
- Estilos de About portados a `app/globals.css` desde `references/templates/home-about/styles.css`: bloque `ABOUT PAGE`. Además, estilos nuevos mínimos para el error por campo, la línea `[ERR]` y el botón deshabilitado, con la paleta existente (`--magenta` / rojo de la terminal).

**Fuera de alcance (para specs futuras):**

- Correo de confirmación al usuario (necesita un dominio verificado en Resend).
- Rate limit, captcha o cualquier protección anti-spam más allá del honeypot.
- Guardar los mensajes en una base de datos o mostrarlos en un panel.
- Plantillas con React Email.
- Bloques `GAMEPAD` y `Theme variants` de `styles.css`.
- Rellenar el nombre o el correo con la sesión simulada (`av_user`).
- Completar las pantallas pendientes de la `SPEC 01`.
- Tests automatizados.

---

## Modelo de datos

```ts
// lib/contact-schema.ts (compartido por servidor y cliente)
import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().trim().min(1, "ESCRIBE TU NOMBRE").max(50, "MÁXIMO 50 CARACTERES"),
  email: z.string().trim().email("CORREO NO VÁLIDO").max(254, "CORREO DEMASIADO LARGO"),
  msg: z.string().trim().min(10, "MÍNIMO 10 CARACTERES").max(2000, "MÁXIMO 2000 CARACTERES"),
});

export type ContactInput = z.infer<typeof contactSchema>;

export type ContactField = keyof ContactInput; // "name" | "email" | "msg"

export type ContactState =
  | { status: "idle" }
  | { status: "invalid"; values: ContactInput; errors: Partial<Record<ContactField, string>> }
  | { status: "sent"; name: string }
  | { status: "failed"; values: ContactInput };
```

```ts
// app/about/actions.ts
"use server";
export async function sendContactMessage(
  prev: ContactState,
  formData: FormData,
): Promise<ContactState>;
```

```ts
// lib/contact-email.ts (solo servidor)
export function buildContactEmail(input: ContactInput): {
  subject: string; // "[Arcade Vault] Mensaje de {name}"
  html: string;    // datos escapados
  text: string;
};
```

Campos del `FormData`: `name`, `email`, `msg` y `website` (honeypot).

Variables de entorno (solo servidor, nunca con prefijo `NEXT_PUBLIC_`):

| Variable | Obligatoria | Ejemplo |
| --- | --- | --- |
| `RESEND_API_KEY` | Sí | `re_xxx` |
| `CONTACT_TO_EMAIL` | Sí | buzón del equipo (con el remitente de prueba, el correo de tu cuenta de Resend) |
| `CONTACT_FROM_EMAIL` | No | `Arcade Vault <onboarding@resend.dev>` (valor por defecto) |

Si falta `RESEND_API_KEY` o `CONTACT_TO_EMAIL`, la acción registra el error en el servidor y devuelve `{ status: "failed" }`. La página no se rompe.

No hay persistencia: los mensajes solo existen en el correo enviado y en el log de Resend.

---

## Plan de implementación

1. **Dependencias y entorno.** `npm install resend zod`. Crear `.env.example` con las tres variables y agregar `!.env.example` a `.gitignore` (hoy `.env*` lo ignora). Verificación: `npm run build` pasa y `git status` muestra `.env.example`.
2. **Estilos.** Portar el bloque `ABOUT PAGE` de `references/templates/home-about/styles.css` a `app/globals.css`. Verificación: `npm run build` pasa.
3. **Página estática.** Crear `app/about/page.tsx` (Server Component, con `metadata`) y `components/about/highlight-icon.tsx`, con hero, highlights, divisor y la intro de contacto. El formulario se muestra como en la plantilla, sin enviar todavía. Incluir `RevealObserver`. Verificación: `/about` se ve como la referencia.
4. **Nav.** Agregar «Acerca de» a la barra y al panel móvil en `components/nav.tsx`, con la sección `"about"` activa en `/about`. Verificación: el enlace navega y queda activo solo en `/about`.
5. **Esquema y correo.** Crear `lib/contact-schema.ts` y `lib/contact-email.ts` (con escape de `& < > " '`). Verificación: `npm run build` pasa sin errores de tipos.
6. **Server Action.** Crear `app/about/actions.ts`: honeypot → validación Zod → comprobar las variables de entorno → `resend.emails.send({ from, to, replyTo, subject, html, text })` → mapear el resultado a `ContactState`. Si Resend devuelve `error` o lanza una excepción, registrar con `console.error` y devolver `failed`. Verificación: `npm run build` pasa.
7. **Formulario cliente.** Crear `components/about/contact-form.tsx` (`"use client"`) con `useActionState(sendContactMessage, { status: "idle" })`. Renderiza los cinco estados: shake al recibir `invalid`, errores por campo, valores conservados con `defaultValue` + `key` (porque React resetea el formulario tras la acción), botón y campos deshabilitados con `pending`, terminal de éxito y terminal de error. «ENVIAR OTRO MENSAJE» y «REINTENTAR» vuelven a la vista del formulario sin recargar. El honeypot queda oculto a la vista y a los lectores de pantalla (`aria-hidden`, `tabIndex={-1}`, `autoComplete="off"`). Verificación: los criterios de aceptación de abajo.
8. **Verificación final.** `npm run lint` y `npm run build`. Comparación con Playwright y envío real según los criterios.

---

## Criterios de aceptación

- [ ] `npm run build` y `npm run lint` terminan sin errores.
- [ ] `/about` muestra hero, 3 highlights, divisor y sección de contacto con los textos exactos de `about.jsx`.
- [ ] «Acerca de» aparece en el nav de escritorio y en el panel móvil, después de «Salón de la Fama», y está activo solo en `/about`.
- [ ] Las secciones `.reveal` aparecen al hacer scroll. Con `prefers-reduced-motion: reduce` se ven sin transición.
- [ ] Enviar con algún campo vacío (con la validación nativa desactivada en las DevTools) produce shake y un error rojo bajo cada campo inválido, sin perder lo escrito.
- [ ] Un mensaje de menos de 10 caracteres muestra «MÍNIMO 10 CARACTERES» bajo MENSAJE.
- [ ] Mientras se envía, el botón dice «▶  TRANSMITIENDO…» y el botón y los campos están deshabilitados.
- [ ] Con `RESEND_API_KEY` y `CONTACT_TO_EMAIL` reales, un envío muestra la terminal de éxito con el nombre en mayúsculas, y el correo llega a `CONTACT_TO_EMAIL` con asunto `[Arcade Vault] Mensaje de {nombre}`, el mensaje en el cuerpo y `Reply-To` igual al correo del formulario.
- [ ] Un nombre con `<b>hola</b>` llega como texto literal en el correo, no como HTML.
- [ ] Sin `RESEND_API_KEY`, el envío muestra la terminal con `[ERR] TRANSMISIÓN FALLIDA…` y «REINTENTAR» vuelve al formulario con los tres campos conservados.
- [ ] «ENVIAR OTRO MENSAJE» vuelve al formulario con los campos vacíos.
- [ ] Un envío con el campo `website` relleno muestra éxito y no aparece ningún envío en el log de Resend.
- [ ] La API key no aparece en ningún bundle del cliente: buscar `re_` en `.next/static` no da resultados.
- [ ] `.env.example` está versionado y `.env.local` no.
- [ ] Comparación con Playwright de `/about` contra `arcade-vault-standalone.html` (ruta About) a 1440 px y 390 px: 0 diferencias de estilos y cajas en el estado inicial y en el de éxito. Solo se aceptan las diferencias de los estados nuevos (carga, error por campo y error de envío).

---

## Decisiones

- **Sí:** ruta `/about`, como pidió el usuario.
- **No:** `/acerca-de`. Era más consistente con `/juegos` y `/salon-de-la-fama`, pero se siguió el patrón en inglés de `/games`.
- **Sí:** Server Action con `useActionState`. No expone un endpoint público, da el estado `pending` de forma nativa y la API key queda solo en el servidor.
- **No:** Route Handler `/api/contact`. Más código y una superficie HTTP pública sin necesidad.
- **Sí:** destino y remitente en variables de entorno, con `onboarding@resend.dev` por defecto y `replyTo` al usuario. Se cambian sin tocar código y el equipo responde directamente.
- **No:** correo de confirmación al usuario. Con el remitente de prueba, Resend solo entrega a la cuenta propia. Requiere un dominio verificado.
- **Sí:** Zod para validar, con el esquema compartido en `lib/contact-schema.ts`. Esquema declarativo y mensajes por campo. Elegido por el usuario frente a la validación manual.
- **Sí:** error de envío en la misma terminal, con `[ERR]` y «REINTENTAR». Mantiene la estética y la plantilla no tenía un estado de error.
- **No:** mensaje de error bajo el botón.
- **Sí:** shake + error por campo. Conserva la plantilla y dice qué campo falló.
- **Sí:** honeypot como única protección anti-spam. Cero dependencias. Rate limit y captcha merecen su propia spec.
- **No:** rate limit en memoria. No funciona con varias instancias serverless.
- **Sí:** correo en HTML + texto generado por una función con escape. Sin dependencias para un correo interno.
- **No:** React Email.
- **Sí:** botón «TRANSMITIENDO…» deshabilitado durante el envío.
- **No:** terminal animada durante la espera. Mostraría `[OK]` antes de saber si el envío funcionó.
- **Sí:** la terminal de éxito solo aparece cuando Resend confirma el envío.
- **Sí:** verificación visual con Playwright contra el standalone, como en la `SPEC 02`, y prueba real del envío a la cuenta propia.

---

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| Con `onboarding@resend.dev`, Resend solo entrega al correo de la cuenta. Otro `CONTACT_TO_EMAIL` falla. | Documentarlo en `.env.example`. El fallo se ve como `[ERR]` y queda en el log del servidor. Para producción hace falta un dominio verificado. |
| React 19 resetea el formulario después de una acción, y se pierden los datos en los errores. | La acción devuelve `values` en `invalid` y `failed`. El cliente los pinta con `defaultValue` y cambia la `key` del formulario. Hay un criterio de aceptación que lo comprueba. |
| La API key se filtra al cliente si se importa `lib/contact-email.ts` o el SDK desde un componente cliente. | Solo `actions.ts` importa `resend`. Agregar `import "server-only"` en `lib/contact-email.ts`. Hay un criterio que busca `re_` en el bundle. |
| Inyección de HTML en el correo a través del nombre o el mensaje. | Escape de HTML en `buildContactEmail`. Hay un criterio con `<b>hola</b>`. |
| Inyección de cabeceras con saltos de línea en el nombre (asunto). | Zod hace `trim` y se reemplazan `\r\n` por espacios antes de armar el asunto. |
| Los bots ignoran el honeypot o lo rellenan con su JS. | Riesgo aceptado. Rate limit y captcha quedan para otra spec. |
| El reset de Tailwind cambia los estilos por defecto de `textarea`, `h1` y `h2` (ya pasó en la `SPEC 02`). | Comparar estilos computados con Playwright y restaurar donde haga falta. |
| Turbopack a veces no recarga cambios de `app/globals.css` o de `.env.local` en dev. | Reiniciar `npm run dev` después de cambiar variables o si un estilo no aparece. |

---

## Qué **no** entra en esta spec

- Confirmación al usuario, dominio propio en Resend.
- Rate limit, captcha, base de datos de mensajes.
- React Email.
- Autocompletar con la sesión simulada.
- Bloques `GAMEPAD` y `Theme variants`.
- Pantallas pendientes de la `SPEC 01`.

Cada uno de estos, si llega, va en su propia spec.
