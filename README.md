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

## Deploy pe Vercel

Fișierul `vercel.json` configurează presetul Next.js, comanda `npm run build` și
directorul de build `.next`, suprascriind setările proiectului din Vercel.
Directorul rădăcină al proiectului trebuie să fie cel care conține `package.json`
și `vercel.json`. După publicarea modificărilor în Git, pornește un nou deployment.

## Configurare

Variabilele disponibile sunt documentate în `.env.example`.
`NEXT_PUBLIC_CONTACT_EMAIL` este opțională și configurează destinatarul pentru
acțiunea de e-mail. Fără această valoare, formularul permite descărcarea brief-ului.
