# CODELAB

Site-ul CODELAB, construit cu Next.js, React, TypeScript și Tailwind CSS.

## Dezvoltare

```sh
npm ci
npm run dev
```

Site-ul este disponibil la http://127.0.0.1:3000.

## Producție

```sh
npm run build
npm run start
```

## Configurare

Variabilele disponibile sunt documentate în `.env.example`.
`NEXT_PUBLIC_CONTACT_EMAIL` este opțională și configurează destinatarul pentru
acțiunea de e-mail. Fără această valoare, formularul permite descărcarea brief-ului.
