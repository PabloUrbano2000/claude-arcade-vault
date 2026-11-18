"use client";

import { useActionState, useState } from "react";
import { sendContactMessage } from "@/app/about/actions";
import {
  CONTACT_LIMITS,
  type ContactField,
  type ContactInput,
  type ContactState,
} from "@/lib/contact-schema";

/** Action result plus a submission counter, used to remount the form after each response. */
interface FormState {
  result: ContactState;
  seq: number;
}

const EMPTY: ContactInput = { name: "", email: "", msg: "" };

async function submit(prev: FormState, formData: FormData): Promise<FormState> {
  return { result: await sendContactMessage(prev.result, formData), seq: prev.seq + 1 };
}

export function ContactForm() {
  const [{ result, seq }, formAction, pending] = useActionState(submit, {
    result: { status: "idle" },
    seq: 0,
  });
  // Submission whose terminal ("sent" / "failed") was closed with its button.
  const [dismissedSeq, setDismissedSeq] = useState(-1);

  const showTerminal = (result.status === "sent" || result.status === "failed") && dismissedSeq !== seq;

  // React resets uncontrolled fields after an action, so values are restored through
  // defaultValue and a `key` that changes with every response.
  const values = result.status === "invalid" || result.status === "failed" ? result.values : EMPTY;
  const errors = result.status === "invalid" ? result.errors : {};
  const shake = result.status === "invalid"; // class applied on mount → animation plays once per response

  const fieldProps = (field: ContactField) => ({
    id: `contact-${field}`,
    name: field,
    defaultValue: values[field],
    disabled: pending,
    required: true,
    "aria-invalid": errors[field] ? true : undefined,
    "aria-describedby": errors[field] ? `contact-${field}-error` : undefined,
  });

  const fieldError = (field: ContactField) =>
    errors[field] ? (
      <span id={`contact-${field}-error`} className="field-error" role="alert">
        {errors[field]}
      </span>
    ) : null;

  return (
    <form
      key={`${seq}-${dismissedSeq}`}
      className={"contact-form" + (shake ? " shake" : "")}
      action={formAction}
    >
      {!showTerminal ? (
        <>
          <div className={"field" + (errors.name ? " invalid" : "")}>
            <label htmlFor="contact-name">NOMBRE</label>
            <input {...fieldProps("name")} maxLength={CONTACT_LIMITS.name.max} placeholder="px_kai" />
            {fieldError("name")}
          </div>
          <div className={"field" + (errors.email ? " invalid" : "")}>
            <label htmlFor="contact-email">CORREO ELECTRÓNICO</label>
            <input
              {...fieldProps("email")}
              type="email"
              maxLength={CONTACT_LIMITS.email.max}
              placeholder="jugador@vault.gg"
            />
            {fieldError("email")}
          </div>
          <div className={"field" + (errors.msg ? " invalid" : "")}>
            <label htmlFor="contact-msg">MENSAJE</label>
            <textarea
              {...fieldProps("msg")}
              rows={5}
              maxLength={CONTACT_LIMITS.msg.max}
              placeholder="Cuéntanos qué tienes en mente…"
            ></textarea>
            {fieldError("msg")}
          </div>

          {/* Honeypot: hidden from people and assistive tech; bots tend to fill it. */}
          <div className="hp-field" aria-hidden="true">
            <label htmlFor="contact-website">WEBSITE</label>
            <input id="contact-website" name="website" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
          </div>

          <button className="btn xl press" type="submit" style={{ width: "100%" }} disabled={pending}>
            {pending ? "▶  TRANSMITIENDO…" : "▶  ENVIAR MENSAJE"}
          </button>
        </>
      ) : (
        <div className={"terminal-success" + (result.status === "failed" ? " failed" : "")} role="status">
          <div className="term-bar">
            <span className="dot r"></span><span className="dot y"></span><span className="dot g"></span>
            <span className="term-title">VAULT-OS // TERMINAL</span>
          </div>
          <div className="term-body">
            <div className="line"><span className="prompt">vault@arcade:~$</span> ./send_message --to=team</div>
            <div className="line dim">[OK] Conectando con servidor…</div>
            <div className="line dim">[OK] Validando contenido…</div>
            {result.status === "sent" ? (
              <>
                <div className="line dim">[OK] Transmitiendo paquete…</div>
                <div className="line success">
                  &gt; MENSAJE RECIBIDO. TE RESPONDEREMOS PRONTO. GRACIAS, {result.name.toUpperCase()}.
                  <span className="caret">_</span>
                </div>
                <div style={{ marginTop: 18 }}>
                  <button className="btn ghost" type="button" onClick={() => setDismissedSeq(seq)}>
                    ENVIAR OTRO MENSAJE
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="line error">
                  [ERR] TRANSMISIÓN FALLIDA. INTÉNTALO DE NUEVO MÁS TARDE.
                  <span className="caret">_</span>
                </div>
                <div style={{ marginTop: 18 }}>
                  <button className="btn ghost" type="button" onClick={() => setDismissedSeq(seq)}>
                    REINTENTAR
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </form>
  );
}
