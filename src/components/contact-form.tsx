"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { Arrow } from "./icons";
import { BudgetSelect } from "./budget-select";
import {
  contactEmail,
  contactLimits,
  contactServiceOptions as serviceOptions,
  formatContactBrief,
  validateContact,
  type ContactFields,
  type ContactErrors as Errors,
} from "@/lib/contact";

type Field = keyof ContactFields;
const fieldOrder: Field[] = ["service", "message", "budget", "name", "email"];

function readFields(data: FormData): ContactFields {
  return Object.fromEntries(
    fieldOrder.map((field) => [field, String(data.get(field) || "").trim()]),
  ) as ContactFields;
}

function BriefField({
  id,
  label,
  optional = false,
  disabled = false,
  error,
  help,
  validation = true,
  className = "",
  children,
}: {
  id: string;
  label: string;
  optional?: boolean;
  disabled?: boolean;
  error?: string;
  help?: ReactNode;
  validation?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`brief-field ${className}`}
      data-invalid={error ? "true" : undefined}
      data-disabled={disabled ? "true" : undefined}
    >
      <label htmlFor={id}>
        {label}
        {optional && <span>Opțional</span>}
      </label>
      <div className="brief-control-wrap">{children}</div>
      {help}
      {validation && (
        <p id={`${id}-error`} className="brief-error" aria-live="polite">
          {error}
        </p>
      )}
    </div>
  );
}

export function ContactForm() {
  const [service, setService] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [stage, setStage] = useState<"editing" | "preparing" | "ready">(
    "editing",
  );
  const [failure, setFailure] = useState("");
  const [brief, setBrief] = useState("");
  const [downloaded, setDownloaded] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  const result = useRef<HTMLHeadingElement>(null);
  const message = useRef<HTMLTextAreaElement>(null);
  const busy = useRef(false);
  const submission = useRef<{ payload: string; id: string } | null>(null);
  const attempts = useRef(false);
  const hint =
    serviceOptions.find((item) => item.value === service)?.hint ||
    "Spune-ne de unde pornești și ce ai vrea să construim. Câteva rânduri sunt suficiente.";

  useEffect(() => {
    const context = new URLSearchParams(location.search).get("service");
    const option = serviceOptions.find((item) => item.id === context);
    if (option) setService(option.value);
  }, []);
  useEffect(() => {
    if (stage === "ready") result.current?.focus();
  }, [stage]);

  function fieldError(field: Field, data: FormData) {
    return validateContact(readFields(data))[field];
  }
  function validateField(field: Field) {
    if (!form.current) return;
    const error = fieldError(field, new FormData(form.current));
    setErrors((current) => ({ ...current, [field]: error }));
  }
  function edited(field: Field) {
    setFailure("");
    if (errors[field] || attempts.current) validateField(field);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current) return;
    attempts.current = true;
    const data = new FormData(event.currentTarget);
    const fields = readFields(data);
    const nextErrors = validateContact(fields);
    setErrors(nextErrors);
    setFailure("");
    const first = fieldOrder.find((field) => nextErrors[field]);
    if (first) {
      form.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    busy.current = true;
    setStage("preparing");
    try {
      const payload = JSON.stringify({
        ...fields,
        website: String(data.get("website") || ""),
      });
      if (submission.current?.payload !== payload)
        submission.current = { payload, id: crypto.randomUUID() };
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...JSON.parse(payload),
          submissionId: submission.current.id,
        }),
        signal: AbortSignal.timeout(20000),
      });
      const responseData = await response.json();
      if (!response.ok || responseData.success !== true) {
        if (responseData.errors) {
          setErrors(responseData.errors);
          const invalid = fieldOrder.find(
            (field) => responseData.errors[field],
          );
          requestAnimationFrame(() =>
            form.current
              ?.querySelector<HTMLElement>(`[name="${invalid}"]`)
              ?.focus(),
          );
        }
        throw new Error(
          responseData.error ||
            "Mesajul nu a putut fi trimis. Încearcă din nou.",
        );
      }
      setBrief(formatContactBrief(fields));
      setDownloaded(false);
      setStage("ready");
    } catch (error) {
      setFailure(
        error instanceof Error && error.name === "Error"
          ? error.message
          : `Mesajul nu a putut fi trimis. Datele sunt păstrate. Încearcă din nou sau scrie-ne la ${contactEmail}.`,
      );
      setStage("editing");
    } finally {
      busy.current = false;
    }
  }
  function download() {
    let link: HTMLAnchorElement | null = null;
    let url = "";
    try {
      url = URL.createObjectURL(
        new Blob([brief], { type: "text/plain;charset=utf-8" }),
      );
      link = document.createElement("a");
      link.href = url;
      link.download = "brief-codelab.txt";
      document.body.append(link);
      link.click();
      setDownloaded(true);
      setFailure("");
    } catch {
      setFailure(
        "Descărcarea nu a putut fi pornită. Încearcă din nou sau revino la editare.",
      );
    } finally {
      link?.remove();
      if (url) setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  }

  return (
    <div className="contact-editorial-main">
      <form
        ref={form}
        id="contact-form"
        className="brief-form"
        noValidate
        onSubmit={submit}
        hidden={stage === "ready"}
        aria-busy={stage === "preparing"}
      >
        <div hidden aria-hidden="true">
          <label htmlFor="contact-website">Website</label>
          <input
            id="contact-website"
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
          />
        </div>
        <fieldset
          className="brief-services"
          disabled={stage === "preparing"}
          aria-describedby={
            errors.service ? "contact-service-error" : undefined
          }
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget))
              validateField("service");
          }}
        >
          <legend>Ce vrei să construim?</legend>
          <div className="brief-service-options">
            {serviceOptions.map((option) => (
              <label className="brief-service-option" key={option.id}>
                <input
                  type="radio"
                  name="service"
                  value={option.value}
                  checked={service === option.value}
                  required
                  aria-invalid={Boolean(errors.service)}
                  aria-describedby={
                    errors.service ? "contact-service-error" : undefined
                  }
                  onChange={() => {
                    setService(option.value);
                    setErrors((current) => ({
                      ...current,
                      service: undefined,
                    }));
                    setFailure("");
                  }}
                />
                <span>
                  {option.value}
                  <span className="brief-service-mark" aria-hidden="true" />
                </span>
              </label>
            ))}
          </div>
          <p
            id="contact-service-error"
            className="brief-error"
            role={errors.service ? "alert" : undefined}
          >
            {errors.service}
          </p>
        </fieldset>
        <BriefField
          id="contact-message"
          label="Câteva cuvinte despre proiect"
          className="brief-message-field"
          disabled={stage === "preparing"}
          error={errors.message}
          help={
            <div
              className="brief-hint-slot"
              aria-live="polite"
              aria-atomic="true"
            >
              <p key={service} id="contact-service-hint">
                {hint}
              </p>
            </div>
          }
        >
          <textarea
            className="brief-control"
            disabled={stage === "preparing"}
            id="contact-message"
            ref={message}
            name="message"
            placeholder="Am în minte…"
            rows={5}
            maxLength={contactLimits.message}
            required
            aria-invalid={Boolean(errors.message)}
            aria-describedby={`contact-service-hint${errors.message ? " contact-message-error" : ""}`}
            onBlur={() => validateField("message")}
            onInput={(event) => {
              const input = event.currentTarget;
              input.style.height = "auto";
              input.style.height = `${Math.min(Math.max(input.scrollHeight, 170), 470)}px`;
              edited("message");
            }}
          />
        </BriefField>
        <BriefField
          id="contact-budget"
          label="Buget orientativ"
          optional
          error={errors.budget}
          className="brief-budget-field"
          disabled={stage === "preparing"}
        >
          <BudgetSelect
            disabled={stage === "preparing"}
            id="contact-budget"
            name="budget"
            onValueChange={() => setFailure("")}
          />
        </BriefField>
        <fieldset className="brief-identity" disabled={stage === "preparing"}>
          <legend>Cum te putem contacta?</legend>
          <div className="brief-identity-grid">
            <BriefField
              id="contact-name"
              label="Numele tău"
              disabled={stage === "preparing"}
              error={errors.name}
            >
              <input
                className="brief-control"
                id="contact-name"
                name="name"
                autoComplete="name"
                maxLength={contactLimits.name}
                required
                aria-invalid={Boolean(errors.name)}
                aria-describedby={
                  errors.name ? "contact-name-error" : undefined
                }
                onBlur={() => validateField("name")}
                onInput={() => edited("name")}
              />
            </BriefField>
            <BriefField
              id="contact-email"
              label="Email"
              disabled={stage === "preparing"}
              error={errors.email}
            >
              <input
                className="brief-control"
                id="contact-email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                maxLength={contactLimits.email}
                autoCapitalize="none"
                spellCheck={false}
                placeholder="nume@domeniu.ro"
                required
                aria-invalid={Boolean(errors.email)}
                aria-describedby={
                  errors.email ? "contact-email-error" : undefined
                }
                onBlur={() => validateField("email")}
                onInput={() => edited("email")}
              />
            </BriefField>
          </div>
        </fieldset>
        <div className="brief-form-bottom">
          <p>
            Trimitem brief-ul către CODELAB.
            <br />
            Îți răspundem pe email.
          </p>
          <button
            type="submit"
            className="brief-primary"
            disabled={stage === "preparing"}
          >
            <span>
              {stage === "preparing" ? "Se trimite…" : "Trimite brief-ul"}
            </span>
            <Arrow />
          </button>
        </div>
      </form>
      <div
        className="brief-ready"
        data-contact-result
        hidden={stage !== "ready"}
      >
        <span className="brief-result-note">Mesaj trimis · CODELAB</span>
        <h2 ref={result} tabIndex={-1}>
          Mulțumim. Am primit brief-ul.
        </h2>
        <p>
          Îți răspundem pe adresa de email din formular. Poți descărca o copie a
          brief-ului pentru tine.
        </p>
        <div className="brief-result-summary">
          <span id="brief-preview-title">Despre proiectul tău</span>
          <div
            className="brief-result-text"
            role="region"
            tabIndex={0}
            aria-labelledby="brief-preview-title"
          >
            <p>{brief.split("\n\n").slice(2).join("\n\n").trim()}</p>
          </div>
        </div>
        <button className="brief-primary" type="button" onClick={download}>
          {downloaded ? "Descarcă din nou" : "Descarcă brief-ul"}
          <Arrow />
        </button>
        <button
          className="brief-edit"
          type="button"
          onClick={() => {
            submission.current = null;
            setStage("editing");
            setFailure("");
            requestAnimationFrame(() => message.current?.focus());
          }}
        >
          Editează și trimite din nou <span aria-hidden="true">↶</span>
        </button>
        <p className="brief-result-footnote">
          Pentru completări, ne poți scrie la {contactEmail}.
        </p>
      </div>
      <p className="brief-generation-error" role="alert">
        {failure}
      </p>
    </div>
  );
}
