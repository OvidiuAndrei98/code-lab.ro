# CODELAB

Site pentru agenția CODELAB de web design și dezvoltare din București. Next.js App Router, React, TypeScript și Tailwind CSS 4. Fonturile DM Sans și Teko sunt locale; identitatea CODELAB folosește litere SVG originale.

## Dezvoltare

```powershell
npm.cmd install
npm.cmd run dev
npm.cmd run typecheck
npm.cmd run build
```

Server local: http://127.0.0.1:3000. Pentru producție, după build: `npm.cmd run start`.

## Direcția actuală

Hero-ul Home și animația lui de intrare rămân cele aprobate. O comparație a capturilor înainte/după redesign confirmă aceeași randare, pixel cu pixel, la 1440 × 1000 cu reduced motion. Nu modifica literele sau stilurile hero-ului când lucrezi la paginile interioare.

Corecția responsive din 2026-10-23 limitează înălțimea literelor numai când hero-ul nu încape într-o fereastră desktop de minimum 600px înălțime. Grila păstrează înălțimea naturală a textului și acțiunii, rezervând loc pentru header și padding. SVG-urile își păstrează forma originală acolo unde încap. `node scripts/verify-hero-fit.mjs` verifică ferestrele late și scurte, redimensionarea în timp real, mobilul, reduced motion, randarea fără JavaScript și identitatea capturii aprobate la 1440 × 1000.

Secțiunea întunecată urcă peste hero prin stacking CSS opac. Cererea explicită din 26 octombrie înlocuiește alungirile individuale și fade-ul cu o presare verticală a întregului CODELAB. Aspectul inițial, cele șapte asseturi și intrarea CSS rămân intacte.

Tranziția CODELAB → FASON folosește un singur ScrollTrigger în `src/lib/home-handoff.ts`. Măsurarea ține cont de conturul real al SVG-urilor: la contact, partea superioară rămâne ancorată, iar baza urmărește exact panoul până la 25% din înălțime pe desktop și 32% pe telefon. Lățimile și spațiile nu se schimbă. Panoul continuă să acopere forma comprimată. Colțurile se îndreaptă înainte de contact, contrastul rămâne integral, iar imaginea FASON este stabilă. Scrollul se inversează din orice punct și se remăsoară la resize. Ecranele scurte și reduced motion păstrează forma statică. `verify-home-handoff.mjs` verifică geometria contactului, opriri, wheel/reverse, resize și variantele statice; `verify-home-project-reveal.mjs` păstrează verificarea imaginii complet vizibile.

Scrollul smooth este păstrat explicit la cererea utilizatorului din 23 octombrie: un singur Lenis în SiteShell, durata 1,15 s, smooth wheel și touch nativ. Această preferință explicită prevalează asupra formulării despre scroll nativ din promptul atașat ulterior. Tab, istoricul și ancorele rămân funcționale. Reduced motion oprește Lenis și mișcarea spațială.

Scrollbarul principal rămâne nativ. Clarificarea finală cere mâner portocaliu pe fundalul întunecat al meniului: pista și marginea interioară folosesc `--ink`, iar thumbul `--accent`. Hoverul și apăsarea mânerului folosesc hârtia, pentru a rămâne vizibile pe cerneală. Spațiul interior, colțurile rotunjite și grosimea confortabilă a sistemului sunt păstrate. Ramura WebKit nativă eliberează explicit proprietățile standard ca să nu concureze cu ele. Celelalte browsere compatibile folosesc scrollbar-color pe accent/cerneală și scrollbar-width:auto. Resetarea moștenirii pe body păstrează independente textarea, meniul și listele locale. Cât meniul este deschis pe desktop cu bară clasică, fundalul gutterului rezervat devine tot cerneală, eliminând fâșia albă fără să schimbe lățimea sau poziția paginii. Sistemele cu bară overlay, touch și contrast ridicat rămân implicite.

`src/lib/native-scrollbar.ts` detectează numai gutterul nativ, fără să preia scrollul. Aceeași funcție este inclusă în head, după stilul critic scrollbar-gutter:stable, înainte de prima afișare, pentru a evita flash-ul barei implicite la refresh. SiteShell reface alegerea la schimbări de lățime, media sau revenirea în fereastră. `node scripts/verify-scrollbar.mjs` verifică paginile principale în Edge și Chrome, wheel/tastatură/tragerea mânerului real, meniul, animațiile, containerele locale, touch și modul overlay cu gutter zero. Detaliile de compatibilitate urmează [standardul CSS](https://drafts.csswg.org/css-scrollbars/) și [documentația Chrome](https://developer.chrome.com/docs/css-ui/scrollbar-styling).

`node scripts/verify-scrollbar-first-paint.mjs` verifică prima afișare în Edge și Chrome cu cache dezactivat și scripturile Next întârziate cu 1500ms: stilul trebuie să existe înainte de hidratare, fără ascunderea paginii. Folosește `SITE_URL` pentru a verifica și buildul de producție. Rapoartele și capturile sunt în `artifacts/scrollbar-*`. Firefox/WebKit nu sunt instalate în mediul local; touch este verificat prin emulare, iar tragerea barei prin interacțiune cu scrollbarul real în browserele disponibile.

Clapeta compactă are aproximativ 52 × 84px desktop și 44 × 71px mobil. SVG-ul 72 × 116 păstrează iconul pe axa headerului și coboară începutul diagonalei cu aproximativ 14px pe desktop / 12px pe mobil, oferind mai mult spațiu în partea de sus. Barele din mijloc și de jos sunt puțin mai scurte: lungimi de 45/30/15 unități, cu începuturile avansând exact 15 unități la dreapta pentru fiecare 15 unități în jos. Linia imaginară prin capetele din stânga rămâne paralelă cu diagonala în pixelii randați; centrul vertical ponderat rămâne 25,5. Forma portocalie este neschimbată. Verificarea folosește pozițiile reale randate în browser. Suprafața rămâne fără contur. Reperul (40,25.5) păstrează axa logo-ului; aceleași bare devin X în 300ms, iar mijlocul dispare în 180ms. Timeline-ul se inversează din poziția curentă. Ținta independentă rămâne minimum 44 × 44px și coada este clicabilă. Muchia este ancorată la dreapta prin preserveAspectRatio="xMaxYMin meet", inclusiv la dimensiuni fracționare. Mecanismul și pagina păstrează aceeași deplasare GSAP. Coada scurtă permite revenirea informațiilor din Home la alinierea lor originală.

Conturul negru în L provenea din shadow-ul dreptunghiular de focus. Au fost eliminate atât vechiul traseu alb de focus, cât și conturul interior permanent. Focusul de tastatură schimbă suprafața în negru și iconul în portocaliu, fără bordură. Starea deschisă rămâne independentă de focus, iar stilurile globale rămân intacte. `node scripts/verify-menu-control-polish.mjs` verifică mouse-ul, apăsarea, Tab/Enter/Space/Escape, contrastul, paralelismul randat, mobilul, transformarea de 300ms și variantele reduced motion/forced colors. Capturile actuale sunt în `artifacts/menu-parallel-burger/`.

Auditul celorlalte controale repară local focusul tăiat al linkurilor FASON de pe Home, contururile prea deschise ale acțiunilor magazinului, contururile tăiate ale eliminării/resetării coșului și contrastul confirmării/anulării programării. `node scripts/audit-control-focus.mjs` inspectează cele zece rute publice la desktop și mobil. `node scripts/verify-control-focus.mjs` verifică și stările dinamice ale coșului, programării, notelor Studio, bugetului și rezultatului brief-ului la 1440, 390 și 320px. Dovezile sunt în `artifacts/control-focus-audit/`.

Interiorul din `side-menu.css` păstrează marcajul mic și cinci linkuri display dimensionate după panou. Lista începe aproape de bara superioară; informațiile reale ale studioului încheie compoziția. Cuvintele intră din măști în 360ms, cu decalaj de 40ms, în paralel cu push-ul de 450ms; inversarea este mai scurtă și continuă din starea curentă. Hoverul folosește același `ReorderingLabel` ca footerul, conform corecției utilizatorului, nu rolloverul vertical din brief. Pe ecrane scunde se derulează numai `.menu-content`, iar clapeta rămâne accesibilă. Redeschiderea resetează scrollul interior după afișarea panoului și stabilirea focusului. Selectarea altei rute normalizează imediat pagina înainte de snapshotul nativ, fără a întârzia navigarea.

Home prezintă FASON printr-un rând compact cu nume, tip și status, un preview original aproape pe întreaga lățime și o încheiere cu descriere și destinație. Nu există titlu monumental separat ori galerie de miniaturi. Imaginea este complet vizibilă și se stabilizează la încheierea suprapunerii. HTML-ul original are proporții desktop și pe mobil.

După FASON, indexul sticky păstrează compoziția, textele, fonturile și aliniamentele existente. O singură liniuță portocalie de 24×1px se deplasează fizic prin cele nouă poziții, în timp ce reperele gri de 16px și gradațiile de 8px reacționează discret după distanța reală față de aceasta: maximum 2px/3px de alungire și un contrast neutru puțin mai puternic. Gradațiile nu devin portocalii. Hoverul etichetelor folosește negrul existent pentru contrast corect la 13px, păstrând accentul pe indicator. `serviceProgress()` din `src/lib/service-progress.ts` folosește centrele primelor rânduri ale titlurilor la linia de focalizare de 47%; aceeași stare determină poziția liniuței, reacția gradațiilor și aria-current. Navigarea prin hash și singurul Lenis rămân existente, cu scroll margins măsurate. Nu există tween-uri independente sau actualizări React pe scroll. ResizeObserver și fonturile actualizează măsurătorile. Reduced motion poziționează liniuța direct la serviciul activ și păstrează gradațiile statice. Indexul rămâne ascuns sub 1001px. THE ROUTING LINE, componenta SVG și logica sa exclusivă au fost eliminate; spațiul revine titlurilor și textelor. `node scripts/verify-home-services.mjs` verifică cele nouă gradații, pozițiile fracționare, un singur accent, geometria originală a coloanei stângi, oprirea/revenirea, fiecare click, tastatura, resize-ul, Edge/Chrome, DPR 1/1,25/2, touch, reduced motion, no-JS și Axe. Dovezile sunt în `artifacts/service-ruler-polish/`.

Footerul global folosește o grilă asimetrică, semnătura SVG originală proporțională (832 × 320) și un index permanent Proiecte / Servicii / Studio / Contact. Cele patru rânduri au dimensiuni egale și, pe desktop, se înscriu în înălțimea siglei; Contact nu are un gol suplimentar. La maximum 980px compoziția se stivuiește, păstrând ținte confortabile. La hover cu mouse-ul, `FooterNavigationLink` inversează imediat cuvântul și reașază literele începând cu ultima din varianta inversată, în 190–250ms. Stratul animat este aria-hidden, numele accesibil rămâne original, iar ieșirea rapidă, resize-ul și schimbarea preferințelor opresc curat secvența. Tastatura, touch și reduced motion păstrează textul normal și feedbackul static. Banda de informații și copyrightul păstrează numai datele confirmate. Un singur reveal de 650ms animă logo-ul ca întreg; fără JavaScript sau cu reduced motion, acesta este vizibil direct. Schimbările de înălțime din formulare și demo-uri recalculează local intrarea. „Înapoi sus” are ancoră reală, folosește scrollerul existent și mută focusul în header. Stilurile sunt izolate în `src/components/site-footer.module.css`; vechile variante Home și globale au fost eliminate. `node scripts/verify-footer.mjs` verifică rutele, proporțiile, responsive, linkurile, tastatura, touch, reduced motion și cazul Contact după pregătirea brief-ului.

Proiecte păstrează prezentarea editorială distinctă a arhivei și destinații reale. Pagina generală Servicii este un index editorial scurt pentru alegerea între Website-uri, Magazin online și Aplicații web. Demonstrațiile și prezentările ample apar numai pe paginile dedicate. Studio explică colaborarea directă și atenția la detalii prin note de meserie, cu un link secundar către portofoliu. Fără echipă, birouri, premii sau rezultate inventate.

Clipul `scrollllll.mp4` a identificat o linie fină în timpul închiderii meniului: fundalul hârtie transpare prin muchia compusă a secțiunilor întunecate la deplasări fracționare. `snapMenuTravel` aliniază aceeași deplasare GSAP a paginii și ansamblului la pixelii fizici, inclusiv la resize și reduced motion. Nu adaugă o bordură sau o bandă peste conținut. Poziția finală rămâne x0, iar muchia clapetei coincide cu a panoului pe lățimile care au spațiu suficient. Probele raster și ultimele cadre de închidere sunt în `artifacts/menu-seam-*.json`.

Săgeata mare din finalul Home este statică, fără efect de hover. Înălțimea vizibilă se aliniază între partea superioară a literelor mici din primul rând și baza celui de-al doilea rând; grosimea este ușor accentuată, cu stroke care nu se scalează. Compoziția aprobată folosește un SVG local și păstrează neschimbate celelalte săgeți. Pe telefon rămân textul și acțiunea compactă către Contact.

## Studiul înregistrărilor

Au fost analizate toate cele cinci clipuri găsite în `D:\skills videos`, câte 12 cadre distribuite pe întreaga durată. Cadrele, planșele și timpii sunt în `artifacts/references/all-clips/`.

- `cosmo.mp4`: identitate îngustă, imagini mari, servicii dense și compoziții de studio în două părți.
- `Recording 2026-10-22 030734.mp4`: relația dintre titlul proiectului și marginea imaginii, spații asimetrice și metadate compacte. Nu am preluat arhitectura sau imaginile ei.
- `Recording 2026-10-22 032556.mp4`: proiecte vizuale și descrieri scurte, cu navigare compactă.
- `Recording 2026-10-22 035429.mp4`: foi de pagină, index de proiecte, navigare și contact simplu.
- `Recording 2026-10-22 040345.mp4`: ritmul dintre imagini, explicații și servicii, legătura dintre overview și pagina proiectului.

Skillurile relevante sunt `clean-editorial-web`, `cosmo-studio-design`, `cinematic-studio-design`, `evidence-led-portfolio`, `layered-page-motion` și skillurile GSAP. Rețetele sunt adaptate, nu cumulate automat. Paleta este hârtie `#eae8e1`, cerneală `#181917` și accent `#c63e24`. Fără 3D, steluțe sau numerotări decorative. Finalul amplu de contact este o excepție cerută explicit pentru cea mai recentă iterație Home.

## Componente și conținut

- `src/components/home.tsx`: hero protejat, lucrări, introducere și servicii.
- `src/components/work-display.tsx`: prezentarea editorială a proiectului din Home.
- `src/components/project-gallery.tsx` și `project-gallery.module.css`: scena comună și alternativa statică pentru arhiva Proiecte.
- `src/components/editorial-motion.tsx`: GSAP scoped, mișcarea suprafețelor și a numelui proiectului, cleanup și reduced motion.
- `src/components/site-shell.tsx`: meniul lipit de marginea paginii, footer, navigare și singurul Lenis.
- `src/app/menu-tab.css` și `src/app/side-menu.css`: clapeta persistentă, mecanismul comun și interiorul tipografic al meniului.
- `src/components/home-continuation.tsx` și `src/app/home-editorial.css`: serviciile tipografice, indicatorul de capitol, pauza Studio și contactul din Home.
- `src/components/service-examples.tsx` și `service-rail.tsx`: resursele demonstrațiilor vechi sunt păstrate; indexul Servicii nu le mai montează.
- `src/app/servicii/page.tsx` și `services-index.module.css`: indexul editorial, cu trei intrări de navigare și un final compact către Contact.
- `src/lib/services.ts`: serviciile, explicațiile și livrabilele comune.
- `src/app/studio-services.css`: sistemul vizual exterior hero-ului. `globals.css` și `animations.css` păstrează baza identității și intrarea aprobată.

Meniul și pagina se deplasează împreună prin aceeași animație GSAP. `.menu-mechanism` are lățime zero și poartă clapeta și panoul dimensionat la 36vw, 58vw sub 800px și cel mult 88vw sub 700px. Pe mobil, lățimea ține cont de muchia reală a viewportului, clapeta de 44px și 12px de spațiu; panoul ascuns nu produce overflow orizontal. Ansamblul devine modal numai cât timp este prezent, prin `role="dialog"`, `aria-modal` și un nume accesibil. Panoul închis este ascuns și inert. Pagina și linkul de skip devin inerte în timpul prezentării. Escape, backdropul și bucla de focus păstrează interacțiunea în ansamblu, iar închiderea restaurează scrollul și focusul. Navigarea între rute rămâne nativă, cu View Transitions în browserele compatibile.

Clapeta folosește etichetele „Deschide meniul” / „Închide meniul” și starea `aria-expanded`; nu are text selectabil sau drag nativ. Mișcarea începe după click/tap confirmat, iar butonul este consumat o singură dată. Deschiderea prin pointer duce focusul la navigație; tastatura păstrează butonul comun. Tokenul de header este 90px pe desktop și 80px până la 800px. Conform ultimei corecții, controlul rămâne sticky pe axa de 45px, respectiv 40px, când logo-ul normal-flow dispare la scroll; headerul nu devine sticky. Calculul geometriei folosește muchia reală a ansamblului, deoarece gutterul stabil poate fi inclus diferit în `documentElement.clientWidth`. Ajustarea țintei și a suprapunerii înguste urmărește același progres al deplasării, fără salt lateral independent.

Blocarea paginii pentru modalul curent folosește `body:has([data-menu-modal]) { overflow: clip }`. Varianta anterioară `hidden`, folosită de vechiul dialog și combinată cu rădăcina oprită de Lenis, transforma body într-un nou reper de scroll și făcea să sară elementele sticky din Home și Proiecte. Corecția păstrează aceeași poziție și aceeași animație laterală; verificarea urmărește și cadrele din timpul deschiderii/închiderii, inclusiv eliberarea modalului și reluarea Lenis. Cadrele clipului și demonstrația cauzei sunt în `artifacts/references/bug-sidebar/`.

Studiul anterior `scripts/diagnose-sidebar-motion.mjs` și raportul `artifacts/sidebar-motion-after.json` documentează corecția saltului sticky pe Home, Proiecte și Website-uri; `sidebar-native-lock-after.json` păstrează dovezile blocării și reluării scrollului pe touch și cu mișcare redusă. Regresia mecanismului actual este acoperită de suita clapetei.

`node scripts/verify-menu-tab.mjs` verifică clapeta închisă, traseul comun cu panoul, burgerul/X-ul, întreruperile, clickurile succesive, axa sticky, ținta de 44px și lipsa overflow-ului. Acoperă desktop, mobil îngust, landscape, scrollbar clasic, focus, Escape, backdrop, poziția păstrată, navigarea reală și reduced motion. `node scripts/verify-navigation-polish.mjs` rămâne punctul de intrare compatibil pentru aceeași suită.

## Proiectele

`src/lib/projects.ts` este sursa comună pentru Home, Proiecte, dovezile din serviciile dedicate și paginile de proiect. În colecția `projects` adaugă numai proiecte reale, cu slug unic, stare, descriere, scope și media. Câmpul `service` alege categoria `website`, `ecommerce` sau `aplicatii`. Studio trimite secundar la arhivă și nu mai prezintă un proiect în pagină.

La cererea explicită de previzualizare cu două lucrări, `archiveProjects` completează colecția reală cu exemplul CARNET din `archiveExamples`. Acesta este marcat `isDemo: true` și „Concept demonstrativ”, are ruta funcțională `/proiecte/carnet-demo` și apare exclusiv în arhivă și în navigarea dintre proiecte. Home și dovezile serviciilor folosesc în continuare doar lucrările reale. Preview-ul local static este în `public/previews/carnet-demo/` și reutilizează carnetul demonstrativ din magazin, fără a inventa un client sau rezultate. Exemplul poate fi eliminat ulterior din `archiveExamples`.

Arhiva este `/proiecte`, iar destinațiile sunt `/proiecte/[slug]`. `/work` și `/work/[slug]` redirecționează permanent către echivalentele românești.

Media acceptă `type: "image"` cu `src`, `width`, `height`, `alt` sau `type: "html"` cu `src`, `width`, `height`. `ProjectMedia` păstrează proporțiile și dimensionează HTML-ul chiar înainte de hidratare. Exportul HTML este izolat, fără scripturi, clickuri sau focus intern. FASON păstrează viewport-ul desktop 1440 × 960 inclusiv pe telefon. Exportul original se află în `public/previews/fason/`; captura de servicii contestată nu este utilizată.

Arhiva deschide cu o introducere compactă, urmată de panouri editoriale ample pentru FASON și CARNET. Noua direcție înlocuiește explicit masca laterală: întregul panou CARNET urcă de jos și acoperă FASON, care rămâne stabil. Banda de deasupra imaginii grupează numele în Teko, categoria, statutul și linkul permanent al proiectului, fără numerotări decorative. Corecția explicită ulterioară elimină inclusiv 01/02 din panourile proiectelor. Pentru CARNET, „Concept demonstrativ” și „Fără client real” rămân vizibile. Identitatea și imaginea se deplasează împreună; nu mai există titluri detașate sau index separat de previzualizare.

O scenă sticky limitată și un singur progres de scroll asigură prezentarea primului proiect, urcarea celui de-al doilea, o scurtă prezentare completă a acestuia și ieșirea naturală către final. Capturile nu se deformează, nu se rotesc și nu primesc blur. Dimensiunile se adaptează spațiului real de sub navigare, iar preview-urile se pregătesc înaintea activării. Dacă cititorul a intrat deja în articolele statice, activarea întârziată așteaptă revenirea deasupra galeriei. Pe mobil, pe ecrane joase, fără JavaScript, cu reduced motion sau la încărcare eșuată, proiectele rămân în flux vertical normal. Linkurile își păstrează destinațiile în timpul suprapunerii; focusul trebuie să arate proiectul vizat și să evite controalele acoperite. `node scripts/verify-project-gallery.mjs` verifică geometria, opririle, reversarea, linkurile, tastatura, touch, resize și variantele statice. `verify-portfolio-motion.mjs` păstrează verificarea materialelor și destinațiilor reale.

Referința acestei iterații este `D:/skills videos/scroll reveal.mp4`, care durează 10,6 secunde. Studiul se concentrează pe intervalul 4–10,6s: o suprafață nouă urcă peste precedenta, refolosește poziția de prezentare și apoi eliberează galeria. Compoziția CODELAB este originală, cu panouri mai late și informațiile integrate deasupra imaginii. Cadrele și observațiile sunt în `artifacts/references/scroll-reveal/`; `scripts/extract-scroll-reveal-reference.mjs` reproduce extracția fără a copia materialele studioului de referință.

## Verificări

Cu serverul pornit:

```powershell
npm.cmd run check:browser
node scripts/verify-scrollbar.mjs
node scripts/verify-scrollbar-first-paint.mjs
node scripts/verify-menu-tab.mjs
node scripts/verify-menu-control-polish.mjs
node scripts/verify-menu-seam.mjs
node scripts/verify-service-examples.mjs
node scripts/verify-services-index.mjs
node scripts/verify-project-gallery.mjs
node scripts/verify-portfolio-motion.mjs
node scripts/verify-hero-entry.mjs
node scripts/verify-home-overlap.mjs
node scripts/verify-home-chapter.mjs
node scripts/verify-website-service.mjs
node scripts/verify-shop-service.mjs
node scripts/verify-request-demo-state.mjs
node scripts/verify-app-service.mjs
node scripts/verify-studio-editorial.mjs
node scripts/verify-contact-editorial.mjs
node scripts/verify-contact-fields.mjs
```

Acoperă cele zece rute la 320–1920 px, inclusiv exemplul CARNET, audituri axe desktop/mobil, lipsa overflow-ului, meniul și focusul, istoricul, ancorele, formularul și brief-ul. Testele de motion verifică intrarea hero-ului cu JavaScript întârziat, scroll înainte/înapoi, oprirea animațiilor la reduced motion, suprapunerea reală peste hero și comportamentul arhivei cu două lucrări. Exemplul CARNET este inclus explicit la cererea utilizatorului; copiile suplimentare pentru cazurile de stress există doar în browser. Preview-urile sunt verificate pe telefon și fără JavaScript.

Capturile actuale sunt `artifacts/new-*-desktop.png`, `artifacts/new-*-mobile.png`, iar referința protejată este `artifacts/approved-hero-before.png`. Copia surselor dinaintea acestui redesign este în `artifacts/checkpoints/before-all-clips-redesign.json`.

## Materiale încă necesare

FASON este singurul proiect real disponibil și este marcat „În lucru”. Sunt necesare materiale reale pentru viitoarele lucrări; nu sunt revendicate rezultate comerciale. Indexarea rămâne dezactivată pentru această versiune de lucru.

Formularul pregătește un brief descărcabil local. Nu trimite email. Configurează `NEXT_PUBLIC_CONTACT_EMAIL` din `.env.example` cu o adresă verificată pentru deschiderea brief-ului în aplicația de email; trimiterea directă ar necesita un serviciu de contact conectat.

Ultima iterație Home are capturi complete la 320, 390, 768, 1024, 1440 și 1920 px în `artifacts/home-chapter-*.png`. `verify-home-chapter.mjs` verifică identitatea hero-ului pixel cu pixel, preview-ul lat și vizibil, stabilizarea imaginii, indicatorul și scrollul invers, încheierea contextului sticky, reduced motion, textul netăiat, contactul și conținutul fără JavaScript. Copia de dinaintea acestei iterații este `artifacts/checkpoints/before-home-editorial-chapter.json`.

## Pagina Website-uri

`/servicii/website-uri` este o pagină dedicată, cu structură proprie în `src/app/servicii/website-uri/page.tsx`, `src/components/website-story.tsx` și `src/app/website-service.css`. Linkurile din Home și overview-ul Servicii duc la această pagină. Magazin online și Aplicații web au pagini distincte, descrise mai jos. Nu sunt generate pagini identice pentru ele.

Deschiderea alătură titlul și explicația serviciului cu preview-ul real FASON, marcat „În lucru”. Același preview rămâne sticky în interiorul secvenței pe desktop și trece între ansamblu, navigare și acțiunea reală „Vorbește cu noi”. Încadrările folosesc exclusiv transformări ale HTML-ului original, fără a modifica proiectul sau a inventa pagini. Indicatorul urmărește explicația vizibilă, inclusiv la scroll invers. Preview-ul rămâne inert; linkul către proiect este separat.

Pe telefon, ecrane scurte și cu reduced motion, cele trei perspective sunt în flux normal, cu detalii statice. După ele apar numai livrabilele confirmate: structură și conținut furnizat de client, design personalizat, adaptare desktop/mobil și formulare. Nu sunt adăugate pachete, prețuri, termene, SEO sau rezultate comerciale.

`node scripts/verify-website-service.mjs` verifică primul ecran, vizibilitatea meniului și a acțiunii reale în crop, succesiunea și reversibilitatea stărilor, limitele sticky, reduced motion, tipografia și lipsa overflow-ului între 320–1920 px, audituri axe desktop/mobil, contactul și păstrarea hero-ului Home pixel cu pixel. Capturile sunt `artifacts/website-opening.png`, `website-navigare.png`, `website-contact.png`, `website-desktop-static.png` și `website-390.png`.

## Pagina Magazin online

`/servicii/magazin-online` are o deschidere frontală și o demonstrație de produs proprie, diferită de Website-uri. Componentele sunt `src/components/shop-demonstration.tsx`, `src/app/servicii/magazin-online/page.tsx` și stilurile izolate `src/app/shop-service.css`. Destinația serviciului din `src/lib/services.ts` și linkul din overview sunt conectate la noua rută; compozițiile Home și Website-uri sunt păstrate.

Nu există un proiect e-commerce real în materialele actuale. Produsul este un concept de carnet fără brand, marcat „Demonstrație interactivă”. Imaginea a fost creată cu instrumentul integrat image_gen și optimizată local în WebP, fără folosirea posterului vechi. Sursa de 1536 × 1024, imaginea web și promptul complet se află în `public/images/shop/`; `ASSET.md` înregistrează proveniența. Imaginea nu reprezintă un produs real sau o lucrare livrată unui client.

Demo-ul permite alegerea A5/A4, cantități între 1 și 20 pentru o adăugare și prețuri ilustrative de 60/90 lei. Adăugările repetate se cumulează pe format. Sumarul local poate fi închis și redeschis, fiecare format poate fi eliminat, iar resetarea readuce formatul A5 și cantitatea 1. Confirmarea este anunțată accesibil; focusul rămâne coerent după eliminare/resetare. Nu există checkout, rezervări de stoc, plăți sau comenzi reale. Contactul cu agenția este separat și duce la brief-ul existent.

Produsul rămâne stabil la schimbarea selecției și a coșului. Sumarul folosește o dezvăluire locală nemodală, fără să blocheze scrollul sau să ascundă imaginea. La 1440 px, suprafața rămâne 1338,625 × 890 px inclusiv cu ambele formate în coș. Pe telefon și tabletă, ordinea este imagine, informații, selecție, adăugare, confirmare. Reduced motion elimină tranziția sumarului.

`node scripts/verify-shop-service.mjs` verifică selecția nativă prin tastatură, limitele cantității, totalurile, adăugările repetate, ambele formate, eliminarea, resetarea și focusul, închiderea/persistența sumarului, stabilitatea imaginii și a suprafeței, responsive 320–1920 px și patru audituri axe (inițial/coș populat, desktop/mobil). Verifică și lipsa cererilor de comandă, reduced motion și destinațiile de contact. `artifacts/shop-clean-390.png`, `shop-clean-1440.png` și capturile de coș documentează compoziția. Comparațiile `hero-after-shop.png` și `website-after-shop.png` confirmă randări identice pixel cu pixel față de reperele protejate.

## Pagina Aplicații web

`/servicii/aplicatii-web` este a treia pagină de servicii, cu propria compoziție de product design: deschidere tipografică asimetrică, suprafață de lucru comună cu trei zone inegale și explicații editoriale legate de comportamentele demonstrate. Nu repetă preview-ul sticky Website-uri sau sumarul de coș Magazin online. Ruta folosește navigarea, fonturile, paleta și singurul Lenis existente. Componentele sunt `src/app/servicii/aplicatii-web/page.tsx`, `src/components/request-workspace.tsx` și stilurile izolate `src/app/app-service.css`.

Demonstrația este etichetată ca date de exemplu. Cele trei solicitări neutre se pot programa în trei intervale disponibile; un al patrulea este ocupat inițial. `src/lib/request-demo.ts` gestionează atomic programările și derivă disponibilitatea și numerele din aceeași stare. Confirmarea verifică din nou intervalul, iar anularea eliberează rezervarea. „Anulează ultima acțiune” restaurează programarea și disponibilitatea împreună, inclusiv după anularea unei programări. Resetarea recreează starea inițială. Datele rămân locale, fără conturi, rezervări reale sau cereri de trimitere.

La programare/anulare, o tranziție FLIP de 280 ms urmărește aceeași solicitare între grupurile listei. Schimbarea selecției dezvăluie discret detaliile; mesajele text comunică rezultatul independent de mișcare. Pe mobil sunt două vederi succesive: listă și detaliu cu acțiune, cu revenire și focus explicit. Controalele sunt native, intervalele ocupate sunt dezactivate, iar reduced motion actualizează direct stările.

`node scripts/verify-request-demo-state.mjs` verifică invarianta de rezervare unică, istoricul, anularea și resetarea, inclusiv 2.500 de acțiuni mixte. `node scripts/verify-app-service.mjs` verifică fluxurile în browser, invalidarea, intervalul inițial ocupat, confirmări repetate, ocuparea pentru alte solicitări, anulare/undo/reset, tastatură și focus, mobil, reflow 320–1920 px, Axe în stările inițială și programată pe desktop/mobil, reduced motion, contactul și absența trimiterilor către backend. Capturile complete și stările sunt în `artifacts/app-root-*.png`.

## Studio: portret editorial

Pagina `/studio` păstrează deschiderea „Suntem CODELAB. / Design și cod, împreună.” și perechea DM Sans/Teko. Corecția din 25 octombrie elimină prezentarea prin dimensiunea agenției din Home, Studio și metadata; în hero, textul secundar începe „De la idee la lansare.” Introducerea și „Lucrezi direct cu noi.” explică experiența colaborării: structură, direcție, pagini și interacțiuni care pot fi încercate, apoi ajustări pe ceva concret. Nu mai enumeră oferta. Un singur link secundar „Vezi proiectele” duce la arhivă. Secțiunea mare FASON și stilurile ei au fost eliminate exclusiv din Studio; materialele originale și toate utilizările din celelalte pagini rămân intacte. Nu sunt inventate persoane, biografii, istoric sau fotografii de echipă.

„Detalii de lucru.” conține trei observații la persoana întâi despre compoziția pe telefon, corectarea unui formular și stările de după click. `src/components/studio-notes.tsx` folosește butoane native cu `aria-pressed`, `aria-controls`, focus vizibil și feedback textual accesibil. Pe desktop, o singură notă apare în marginea stabilă. Pe mobil, toate explicațiile rămân direct sub fragmentele lor; selecția schimbă accentul, fără să mute textul sau scrollul. Nu există hover obligatoriu, tooltip de cursor ori tutorial al interfeței. Tranziția este doar de opacitate, 160 ms, și se oprește curat la schimbarea notei sau la reduced motion. Stilurile sunt izolate în `src/app/studio-editorial.css`.

După note urmează direct „Spune-ne ce ai în minte.”, cu text scurt și acțiunea „Pregătește un brief” către Contact. `node scripts/verify-studio-editorial.mjs` verifică introducerea și colaborarea, absența prezentării FASON, mouse/tastatură/touch, stabilitatea textului și scrollului la adnotări, responsive 320–1920 px, Axe desktop/mobil, reduced motion, lectura fără JavaScript și destinațiile reale. Capturile complete și comparația cu Home/Servicii sunt în `artifacts/studio-polish/`.

## Contact: brief editorial local

Pagina `/contact` are o introducere compactă și un formular dominant, cu o margine îngustă pentru nota de contact. Fluxul este serviciu, descriere, buget opțional și nume/email. Bugetele sunt cele existente în proiect. Niciun serviciu nu este selectat implicit; un context explicit `?service=website|ecommerce|aplicatii|indecis` poate preselecta opțiunea, care rămâne ușor de schimbat. Indiciul de descriere se adaptează selecției într-un spațiu rezervat, fără înlocuirea textului introdus.

Formularul rămâne local: creează un fișier text și un URL Blob, fără trimitere de email sau backend. Procesarea are guard pentru duplicate, stare ocupată reală și tratarea erorilor. Confirmarea oferă descărcare, repetarea descărcării și editare cu toate valorile păstrate, inclusiv cele completate prin autofill. Câmpurile rămân montate și ascunse în starea de rezultat. Erorile sunt explicate lângă câmp și primul câmp invalid primește focus. Nu se impun lungimi minime arbitrare pentru nume sau mesaj.

`src/components/contact-form.tsx`, `src/app/contact/page.tsx` și `src/app/contact-editorial.css` dețin această compoziție. Numele/emailul au autocomplete nativ; radio și textarea sunt native. `BriefField` aliniază labelul permanent, controlul de 18px, o singură delimitare inferioară și ajutorul sau eroarea. Focusul trasează o linie de accent în 190ms, fără dreptunghiul care intersecta labelul; un câmp invalid păstrează eroarea și are o linie mai groasă când este activ. Numele nu mai repetă labelul într-un placeholder. Textarea crește controlat și păstrează scroll pentru mesaje lungi.

`src/components/budget-select.tsx` și CSS Module-ul său folosesc Base UI Select pentru cele cinci opțiuni de buget existente. Valoarea rămâne sincronizată cu formularul, iar „Îl stabilim împreună” este validă. Popupul nemodal păstrează lățimea triggerului, se repoziționează în viewport și diferențiază selecția de evidențierea prin tastatură sau mouse. Nu blochează scrollul paginii; Tab, Escape și clickul exterior păstrează un parcurs firesc. Reduced motion elimină deplasarea de la deschidere și animația liniei. `node scripts/verify-contact-fields.mjs` verifică aceste stări, geometria, tastatura, touch, autofill real în Edge și datele brief-ului; capturile sunt în `artifacts/contact-fields-*`.

Preview-ul rezultatului este o regiune numită, accesibilă prin tastatură. Fără `NEXT_PUBLIC_CONTACT_EMAIL` verificat, pagina comunică explicit că nu există trimitere directă. Dacă este configurat, linkul mailto deschide aplicația de email și nu este prezentat drept trimitere confirmată.

`node scripts/verify-contact-editorial.mjs` verifică selecțiile, contextul URL, stabilitatea indiciului, păstrarea textului, autofill real prin Edge, tastatură, validare, mesaje lungi, eșec local și reîncercare, procesare și acțiuni repetate, fișierul descărcat și editarea. Include responsive 320–1920 px, Axe desktop/mobil, reduced motion și verificarea absenței cererilor de trimitere. Capturile complete sunt `artifacts/contact-root-{390,768,1440}-full.png`.

## Indexul general Servicii

`/servicii` a fost refăcut exclusiv ca index de alegere. O introducere compactă precedă trei rânduri editoriale, pe o grilă comună pentru numele în Teko, explicații și destinații. Denumirile vizibile sunt Website-uri, Magazin online și Aplicații web. Fiecare rând are un singur link semantic, cu numele și explicația asociate accesibil; nu există controale interactive imbricate sau informații ascunse la hover. Pe mobil ordinea este nume, explicație, acțiune. Ancorele `#website`, `#ecommerce` și `#aplicatii` rămân funcționale.

Feedbackul este local: o accentuare discretă a suprafeței în 140 ms și o deplasare diagonală de 4 px a săgeții, 150 ms pe curba existentă `--ease-out`, numai la pointer fin. Eticheta și săgeata formează un grup cu spațiu de 14 px; săgețile celor trei servicii păstrează aceeași axă. Sub 760 px, fiecare intrare curge vertical pentru a proteja proporțiile titlurilor și lectura descrierii. Focusul are un contur vizibil și un accent static; reduced motion elimină mișcarea. Nu există intrări care amână lectura, sticky, pinning sau secvențe copiate din Home. Încheierea compactă pe cerneală duce la `/contact?service=indecis`, care preselectează vizibil „Nu știu încă”.

CSS Module-ul este importat doar de pagina index. Sursele paginilor individuale, Home, Studio, Contact, layout-ul și componentele comune au rămas neschimbate; resursele proiectului și ale demonstrațiilor vechi sunt păstrate. Măsurătorile la viewporturile testate arată conținutul main redus de la 2711 la 1112 px pe desktop și de la 3219 la 1383 px pe telefon. Primul serviciu începe la aproximativ 267 px pe desktop și 292 px pe telefon.

`node scripts/verify-services-index.mjs` verifică cele trei destinații, conținutul permanent și numele consecvente, lipsa demonstrațiilor din index, structura linkurilor, mouse/tastatură/touch, focus, ancore, responsive 320–1920 px, reduced motion, fără JavaScript, Axe și parcursul mai scurt. `verify-service-examples.mjs` verifică acum accesul din index la materialele reale ale celor trei servicii; fluxurile detaliate rămân în suitele dedicate. `verify-portfolio-motion.mjs` testează materialele portofoliului în arhivă și preview-ul fără JavaScript în Home. Capturile sunt `artifacts/services-index-root-{320,390,768,1024,1440,1920}.png`; raportul de izolare a surselor și identitate pixel a hero-ului și serviciilor este în `artifacts/services-overview-regression/report-after.json`.

## Finisare 26 octombrie

Clapeta are o singură reprezentare în tranzițiile native: propriul grup `menu-control` rămâne deasupra foilor, fără snapshot vechi. Head bootstrap-ul din `page-motion.ts` permite unei noi activări a meniului sau navigări să preia imediat controlul de la o tranziție încă activă. Mecanica atașată panoului rămâne aceeași. Verificare: `node scripts/verify-page-motion.mjs`.

Website-uri evidențiază navigația printr-o încadrare mai calmă, păstrând același frame. Magazinul și aplicația au invitații directe și feedback local pentru preț/total/coș, respectiv solicitare/stare/interval. Undo și reset păstrează regulile existente. Studio evită repetițiile, iar posibilitatea de a încerca paginile are mai multă greutate tipografică. Demo-urile rămân locale; Contact pregătește în continuare un fișier, fără trimitere simulată.

Suitele cu capturi istorice verifică glyph-urile hero protejate separat de textele auxiliare corectate ulterior. Garda veche a redesignului exclusiv Proiecte poate fi activată cu `GALLERY_HISTORICAL_SCOPE=1`; verificările interactive actuale ale galeriei rămân implicite.
