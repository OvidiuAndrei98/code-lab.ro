import {
  contactEmail,
  formatContactBrief,
  validateContact,
  type ContactFields,
} from "@/lib/contact";

export const runtime = "nodejs";

const maxBodyBytes = 32 * 1024;
const sendFailure =
  "Mesajul nu a putut fi trimis. Datele sunt păstrate. Încearcă din nou sau scrie-ne la contact@code-lab.ro.";

function json(body: object, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function hasSameOrigin(request: Request) {
  try {
    // Next.js can use an internal hostname behind Vercel's proxy or next start.
    const internalUrl = new URL(request.url);
    const publicHost = request.headers.get("host") || internalUrl.host;
    const forwardedProtocol = request.headers.get("x-forwarded-proto");
    const protocol =
      forwardedProtocol === "https" || forwardedProtocol === "http"
        ? `${forwardedProtocol}:`
        : internalUrl.protocol;
    const publicOrigin = new URL(`${protocol}//${publicHost}`).origin;
    return request.headers.get("origin") === publicOrigin;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!hasSameOrigin(request))
    return json({ error: "Reîncarcă pagina și încearcă din nou." }, 403);
  if (
    request.headers.get("content-type")?.split(";")[0].trim() !==
    "application/json"
  )
    return json({ error: "Formatul cererii nu este acceptat." }, 415);

  let input: Record<string, unknown>;
  try {
    if (Number(request.headers.get("content-length")) > maxBodyBytes)
      return json({ error: "Mesajul este prea lung." }, 413);
    const reader = request.body?.getReader();
    if (!reader) return json({ error: "Completează formularul." }, 400);
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBodyBytes) {
        await reader.cancel();
        return json({ error: "Mesajul este prea lung." }, 413);
      }
      chunks.push(value);
    }
    const parsed: unknown = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
      return json({ error: "Completează formularul." }, 400);
    input = parsed as Record<string, unknown>;
  } catch {
    return json(
      { error: "Formularul nu a putut fi citit. Încearcă din nou." },
      400,
    );
  }

  // Honeypot: this field is hidden from visitors and assistive technology.
  if (typeof input.website !== "string" || input.website !== "")
    return json({ error: "Formularul nu a putut fi trimis." }, 400);
  if (
    typeof input.submissionId !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      input.submissionId,
    )
  )
    return json({ error: "Reîncarcă pagina și încearcă din nou." }, 400);

  const fieldNames = ["name", "email", "service", "budget", "message"] as const;
  if (fieldNames.some((field) => typeof input[field] !== "string"))
    return json({ error: "Verifică datele din formular." }, 400);
  const fields = Object.fromEntries(
    fieldNames.map((field) => [field, (input[field] as string).trim()]),
  ) as ContactFields;
  const errors = validateContact(fields);
  if (Object.keys(errors).length)
    return json({ error: "Verifică datele din formular.", errors }, 400);

  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.error(
      "Contact email unavailable: RESEND_API_KEY is not configured.",
    );
    return json({ error: sendFailure }, 503);
  }
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `contact/${input.submissionId}`,
      },
      body: JSON.stringify({
        from:
          process.env.RESEND_FROM_EMAIL?.trim() || `CODELAB <${contactEmail}>`,
        to: [contactEmail],
        reply_to: fields.email,
        subject: `Proiect nou: ${fields.service} — ${fields.name}`,
        text: formatContactBrief(fields),
      }),
      signal: AbortSignal.timeout(15000),
      cache: "no-store",
    });
    if (!response.ok) {
      // Do not log submitted personal data, credentials or provider response bodies.
      console.error("Contact email rejected by Resend:", response.status);
      return json({ error: sendFailure }, response.status === 429 ? 429 : 502);
    }
    const result: unknown = await response.json();
    if (
      !result ||
      typeof result !== "object" ||
      !("id" in result) ||
      typeof result.id !== "string" ||
      !result.id
    )
      throw new Error("Missing email confirmation");
    return json({ success: true });
  } catch {
    console.error("Contact email request failed or timed out.");
    return json({ error: sendFailure }, 502);
  }
}
