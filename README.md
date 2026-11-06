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

Formularul de contact trimite mesajele către `contact@code-lab.ro` prin ruta
server `POST /api/contact` și API-ul Resend. Adresa vizitatorului este setată ca
`Reply-To`, astfel încât răspunsurile ajung direct la acesta. Confirmarea apare
doar după acceptarea mesajului de către Resend; în caz de eroare, datele rămân
în formular. Reîncercările cu aceleași date folosesc aceeași cheie pentru a evita
mesajele duplicate.

- Configurează `RESEND_API_KEY` în Vercel, pentru mediile Production și Preview
  în care vrei să funcționeze formularul, apoi pornește un nou deployment.
- Pentru dezvoltare locală, copiază `.env.example` în `.env.local` și completează
  cheia. Nu folosi prefixul `NEXT_PUBLIC_` pentru cheia Resend.
- Domeniul `updates.code-lab.ro` trebuie să fie verificat pentru trimitere în Resend.
  Expeditorul implicit este `CODELAB <contact@updates.code-lab.ro>`; îl poți schimba prin
  `RESEND_FROM_EMAIL` cu o adresă de pe alt domeniu verificat. Destinatarul rămâne
  `contact@code-lab.ro`.

Ruta validează câmpurile, limitează dimensiunea cererii și verifică originea și
un câmp ascuns pentru roboți. Pentru limitarea traficului abuziv în producție,
configurează o regulă Vercel Firewall pentru `/api/contact`. Mesajele sunt text
simplu, iar datele personale și cheia nu sunt scrise în loguri.

Formularul de programări din demonstrația aplicației web rămâne local și nu
trimite emailuri.

Rulează `npm run test:contact` cu Node.js 24+ pentru verificarea rutei
cu Resend simulat; testele nu trimit emailuri reale.
