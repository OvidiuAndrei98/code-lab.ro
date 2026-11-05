"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { Arrow } from "./icons";
import { BudgetSelect } from "./budget-select";

const serviceOptions = [
  {
    id: "website",
    value: "Website",
    hint: "Ce face afacerea ta și ce trebuie să comunice site-ul?",
  },
  {
    id: "ecommerce",
    value: "Magazin online",
    hint: "Ce produse vinzi? Există deja un magazin pe care vrei să-l schimbăm?",
  },
  {
    id: "aplicatii",
    value: "Aplicație web",
    hint: "Ce proces vrei să organizezi și cine va folosi aplicația?",
  },
  {
    id: "indecis",
    value: "Nu știu încă",
    hint: "De unde pornește ideea și ce problemă ai vrea să rezolvi?",
  },
] as const;

type Field = "service" | "message" | "name" | "email";
type Errors = Partial<Record<Field, string>>;

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

export function ContactForm({ contactEmail = "" }: { contactEmail?: string }) {
  const [service, setService] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [stage, setStage] = useState<"editing" | "preparing" | "ready">(
    "editing",
  );
  const [failure, setFailure] = useState("");
  const [brief, setBrief] = useState({ text: "", url: "" });
  const [downloaded, setDownloaded] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  const result = useRef<HTMLHeadingElement>(null);
  const message = useRef<HTMLTextAreaElement>(null);
  const busy = useRef(false);
  const preparedUrl = useRef("");
  const attempts = useRef(false);
  const hint =
    serviceOptions.find((item) => item.value === service)?.hint ||
    "Spune-ne de unde pornești și ce ai vrea să construim. Câteva rânduri sunt suficiente.";

  useEffect(() => {
    const context = new URLSearchParams(location.search).get("service");
    const option = serviceOptions.find((item) => item.id === context);
    if (option) setService(option.value);
    return () => {
      if (preparedUrl.current) URL.revokeObjectURL(preparedUrl.current);
    };
  }, []);
  useEffect(() => {
    if (stage === "ready") result.current?.focus();
  }, [stage]);

  function fieldError(field: Field, data: FormData) {
    const value = String(data.get(field) || "").trim();
    if (
      field === "service" &&
      !serviceOptions.some((item) => item.value === value)
    )
      return "Alege un serviciu sau «Nu știu încă».";
    if (field === "message" && !value)
      return "Scrie câteva cuvinte despre ce ai în minte.";
    if (field === "name" && !value) return "Scrie cum te numești.";
    if (field === "email") {
      if (!value) return "Scrie adresa la care te putem contacta.";
      const input = form.current?.elements.namedItem(
        "email",
      ) as HTMLInputElement | null;
      if (input?.validity.typeMismatch) return "Verifică adresa de email.";
    }
    return undefined;
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
    const nextErrors: Errors = {};
    const order: Field[] = ["service", "message", "name", "email"];
    order.forEach((field) => {
      const error = fieldError(field, data);
      if (error) nextErrors[field] = error;
    });
    setErrors(nextErrors);
    setFailure("");
    const first = order.find((field) => nextErrors[field]);
    if (first) {
      form.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    busy.current = true;
    setStage("preparing");
    try {
      const text = `Salut, CODELAB!\n\nNume: ${String(data.get("name")).trim()}\nEmail: ${String(data.get("email")).trim()}\nProiect: ${data.get("service")}\nBuget orientativ: ${data.get("budget")}\n\n${String(data.get("message")).trim()}\n`;
      const file = new Blob([text], { type: "text/plain;charset=utf-8" });
      // Await the actual local file; there is no simulated send or artificial delay.
      await file.arrayBuffer();
      const url = URL.createObjectURL(file);
      if (preparedUrl.current) URL.revokeObjectURL(preparedUrl.current);
      preparedUrl.current = url;
      setBrief({ text, url });
      setDownloaded(false);
      setStage("ready");
    } catch {
      setFailure(
        "Brief-ul nu a putut fi pregătit. Datele sunt păstrate. Încearcă din nou.",
      );
      setStage("editing");
    } finally {
      busy.current = false;
    }
  }
  function download() {
    let link: HTMLAnchorElement | null = null;
    try {
      link = document.createElement("a");
      link.href = brief.url;
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
          validation={false}
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
            Pregătești un fișier descărcabil.
            <br />
            Pagina nu trimite mesaje.
          </p>
          <button
            type="submit"
            className="brief-primary"
            disabled={stage === "preparing"}
          >
            <span>
              {stage === "preparing"
                ? "Pregătim fișierul…"
                : "Pregătește brief-ul"}
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
        <span className="brief-result-note">
          Fișier local · gata de descărcat
        </span>
        <h2 ref={result} tabIndex={-1}>
          Brief-ul e pregătit.
        </h2>
        <p>
          Informațiile sunt adunate într-un fișier text. Descarcă-l, verifică-l
          și alege când îl trimiți.
        </p>
        <div className="brief-result-summary">
          <span id="brief-preview-title">Despre proiectul tău</span>
          <div
            className="brief-result-text"
            role="region"
            tabIndex={0}
            aria-labelledby="brief-preview-title"
          >
            <p>{brief.text.split("\n\n").slice(2).join("\n\n").trim()}</p>
          </div>
        </div>
        <button className="brief-primary" type="button" onClick={download}>
          {downloaded ? "Descarcă din nou" : "Descarcă brief-ul"}
          <Arrow />
        </button>
        {contactEmail && (
          <a
            className="brief-email-action"
            href={`mailto:${contactEmail}?subject=${encodeURIComponent("Un proiect nou — CODELAB")}&body=${encodeURIComponent(brief.text)}`}
          >
            Deschide în aplicația de email <Arrow diagonal />
          </a>
        )}
        <button
          className="brief-edit"
          type="button"
          onClick={() => {
            setStage("editing");
            setFailure("");
            requestAnimationFrame(() => message.current?.focus());
          }}
        >
          Editează brief-ul <span aria-hidden="true">↶</span>
        </button>
        <p className="brief-result-footnote">
          {contactEmail
            ? "Linkul de email deschide aplicația ta. Trimiterea rămâne alegerea ta."
            : "Brief-ul rămâne la tine. Trimiterea directă nu este disponibilă în această versiune."}
        </p>
      </div>
      <p className="brief-generation-error" role="alert">
        {failure}
      </p>
    </div>
  );
}
