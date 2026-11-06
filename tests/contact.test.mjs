import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import test from "node:test";

// Resolve the same source alias as Next.js; Node strips the TypeScript types.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "@/lib/contact")
      return {
        url: new URL("../src/lib/contact.ts", import.meta.url).href,
        shortCircuit: true,
      };
    return nextResolve(specifier, context);
  },
});
const { POST } = await import("../src/app/api/contact/route.ts");
const submission = {
  name: "Ana Popescu",
  email: "ana+proiect@example.com",
  service: "Website",
  budget: "Sub 2.000 €",
  message:
    "Un website pentru atelierul nostru.\nAvem deja identitatea vizuală.",
  website: "",
  submissionId: "8333f47c-95dd-4e42-a649-bcb7bbf38656",
};
function request(body = submission, headers = {}) {
  return new Request("https://code-lab.ro/api/contact", {
    method: "POST",
    headers: {
      origin: "https://code-lab.ro",
      "content-type": "application/json",
      ...headers,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

test("contact API validates requests and sends only through the server", async (t) => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.RESEND_API_KEY;
  const originalSender = process.env.RESEND_FROM_EMAIL;
  const originalConsoleError = console.error;
  const sent = [];
  const logs = [];
  process.env.RESEND_API_KEY = "test-key-not-a-real-credential";
  delete process.env.RESEND_FROM_EMAIL;
  console.error = (...args) => logs.push(args.join(" "));
  globalThis.fetch = async (url, options) => {
    sent.push({ url, ...options, payload: JSON.parse(options.body) });
    return Response.json({ id: "test-email-id" });
  };
  t.after(() => {
    globalThis.fetch = originalFetch;
    console.error = originalConsoleError;
    if (originalKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = originalKey;
    if (originalSender === undefined) delete process.env.RESEND_FROM_EMAIL;
    else process.env.RESEND_FROM_EMAIL = originalSender;
  });

  await t.test(
    "rejects other origins, invalid content, JSON and non-object bodies",
    async () => {
      assert.equal(
        (await POST(request(submission, { origin: "https://other.example" })))
          .status,
        403,
      );
      const noOrigin = request();
      noOrigin.headers.delete("origin");
      assert.equal((await POST(noOrigin)).status, 403);
      assert.equal(
        (await POST(request("{}", { "content-type": "text/plain" }))).status,
        415,
      );
      for (const body of ["{", "null", "[]"])
        assert.equal((await POST(request(body))).status, 400);
      assert.equal(sent.length, 0);
    },
  );
  await t.test(
    "uses the public origin when Next.js runs behind a proxy",
    async () => {
      const proxied = (origin) =>
        new Request("http://localhost:3000/api/contact", {
          method: "POST",
          headers: {
            host: "code-lab.ro",
            "x-forwarded-proto": "https",
            origin,
            "content-type": "application/json",
          },
          body: "{}",
        });
      assert.equal((await POST(proxied("https://code-lab.ro"))).status, 400);
      assert.equal((await POST(proxied("http://code-lab.ro"))).status, 403);
      assert.equal((await POST(proxied("https://other.example"))).status, 403);
      assert.equal(sent.length, 0);
    },
  );
  await t.test(
    "validates required fields, header injection, services and budgets",
    async () => {
      const response = await POST(
        request({
          ...submission,
          name: "Ana\r\nBcc: other@example.com",
          email: "ana@example.com\r\nBcc: other@example.com",
          message: " ",
          service: "Unknown",
          budget: "Unknown",
        }),
      );
      assert.equal(response.status, 400);
      const { errors } = await response.json();
      for (const field of ["name", "email", "message", "service", "budget"])
        assert.equal(typeof errors[field], "string");
      assert.equal(
        (await POST(request({ ...submission, email: [submission.email] })))
          .status,
        400,
      );
      assert.equal(sent.length, 0);
    },
  );
  await t.test(
    "rejects bots, malformed IDs and oversized bodies without Content-Length",
    async () => {
      for (const body of [
        { ...submission, website: "spam.example" },
        { ...submission, submissionId: "bad-id" },
        { ...submission, message: "x".repeat(8001) },
      ])
        assert.equal((await POST(request(body))).status, 400);
      assert.equal(
        (await POST(request({ ...submission, message: "x".repeat(33000) })))
          .status,
        413,
      );
      assert.equal(
        (await POST(request(submission, { "content-length": "33000" }))).status,
        413,
      );
      assert.equal(sent.length, 0);
    },
  );
  await t.test("handles a missing API key without calling Resend", async () => {
    delete process.env.RESEND_API_KEY;
    assert.equal((await POST(request())).status, 503);
    assert.equal(sent.length, 0);
    process.env.RESEND_API_KEY = "test-key-not-a-real-credential";
  });
  await t.test(
    "fixes the recipient, sets Reply-To and sends the full brief as text",
    async () => {
      const response = await POST(
        request({
          ...submission,
          to: "other@example.com",
          from: "other@example.com",
        }),
      );
      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), { success: true });
      assert.equal(response.headers.get("cache-control"), "no-store");
      const email = sent.at(-1);
      assert.equal(email.url, "https://api.resend.com/emails");
      assert.equal(
        email.headers.Authorization,
        "Bearer test-key-not-a-real-credential",
      );
      assert.deepEqual(email.payload.to, ["contact@code-lab.ro"]);
      assert.equal(email.payload.from, "CODELAB <contact@updates.code-lab.ro>");
      assert.equal(email.payload.reply_to, submission.email);
      assert.match(email.payload.subject, /Website/);
      assert.ok(email.payload.text.includes(submission.message));
      assert.ok(email.payload.text.includes(submission.budget));
      assert.equal(email.payload.html, undefined);
      assert.equal(email.cache, "no-store");
      assert.ok(email.signal instanceof AbortSignal);
    },
  );
  await t.test(
    "retries retain their idempotency key and accept an optional sender",
    async () => {
      const firstKey = sent.at(-1).headers["Idempotency-Key"];
      assert.equal((await POST(request())).status, 200);
      assert.equal(sent.at(-1).headers["Idempotency-Key"], firstKey);
      assert.equal(firstKey, `contact/${submission.submissionId}`);
      process.env.RESEND_FROM_EMAIL = "CODELAB <forms@send.code-lab.ro>";
      assert.equal(
        (await POST(request({ ...submission, budget: "" }))).status,
        200,
      );
      assert.equal(sent.at(-1).payload.from, process.env.RESEND_FROM_EMAIL);
      assert.match(sent.at(-1).payload.text, /Îl stabilim împreună/);
      delete process.env.RESEND_FROM_EMAIL;
    },
  );
  await t.test(
    "provider failures, timeouts and missing IDs never report success",
    async () => {
      for (const status of [403, 429, 500]) {
        globalThis.fetch = async () =>
          Response.json({ message: "private-provider-detail" }, { status });
        const response = await POST(request());
        assert.equal(response.status, status === 429 ? 429 : 502);
        assert.ok(!(await response.text()).includes("private-provider-detail"));
      }
      for (const name of ["TypeError", "TimeoutError"]) {
        globalThis.fetch = async () => {
          throw new DOMException("private-detail", name);
        };
        assert.equal((await POST(request())).status, 502);
      }
      globalThis.fetch = async () => Response.json({});
      assert.equal((await POST(request())).status, 502);
      globalThis.fetch = async () => new Response("invalid json");
      assert.equal((await POST(request())).status, 502);
    },
  );
  await t.test(
    "logs omit credentials, visitor details and provider responses",
    () => {
      for (const privateValue of [
        "test-key-not-a-real-credential",
        submission.email,
        submission.name,
        submission.message,
        "private-provider-detail",
        "private-detail",
      ])
        assert.ok(!logs.join("\n").includes(privateValue));
    },
  );
});
