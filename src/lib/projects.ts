export type ServiceKind = "website" | "ecommerce" | "aplicatii";

export type ProjectMediaSource =
  | { type: "html"; src: string; width: number; height: number }
  | { type: "image"; src: string; width: number; height: number; alt: string };

export type Project = {
  isDemo?: boolean;
  slug: string;
  title: string;
  category: string;
  discipline: string;
  service: ServiceKind;
  serviceLabel: string;
  summary: string;
  media: ProjectMediaSource;
  status: string;
  headline: string;
  description: string;
  approach: string;
  scope: readonly string[];
  note: string;
  tone: "dark" | "light";
};

// Add a real project here: every portfolio surface reads the same collection.
// HTML previews must be self-contained, static and inert; screenshots use "image".
export const projects: readonly Project[] = [
  {
    slug: "fason",
    title: "FASON",
    category: "Studio de hair design",
    discipline: "Web design & development",
    service: "website",
    serviceLabel: "Website de prezentare",
    summary: "Website de prezentare pentru un studio de hair design.",
    media: {
      type: "html",
      src: "/previews/fason/index.html",
      width: 1440,
      height: 960,
    },
    status: "În lucru",
    headline: "Un website pentru identitatea FASON.",
    description:
      "Lucrăm la designul și dezvoltarea website-ului FASON, un studio de hair design. Preview-ul prezintă direcția vizuală a proiectului, aflat încă în lucru.",
    approach:
      "O imagine amplă și titluri clare stabilesc direcția vizuală. Serviciile, echipa și datele de contact au locuri distincte în navigare, pentru ca vizitatorul să știe unde găsește informația.",
    scope: [
      "Direcție digitală",
      "Design de interfață",
      "Dezvoltare web",
      "Motion design",
    ],
    note: "Proiect în lucru. Imaginile prezintă versiunea curentă a interfeței.",
    tone: "dark",
  },
];

// Archive-only demonstrative example; never presented as client work on Home.
const archiveExamples: readonly Project[] = [
  {
    isDemo: true,
    slug: "carnet-demo",
    title: "CARNET",
    category: "Magazin online",
    discipline: "Concept vizual",
    service: "ecommerce",
    serviceLabel: "Magazin online",
    summary: "Concept demonstrativ de magazin online, fără client real.",
    media: {
      type: "html",
      src: "/previews/carnet-demo/index.html",
      width: 1440,
      height: 960,
    },
    status: "Concept demonstrativ",
    headline: "Un exemplu pentru a vedea arhiva cu două proiecte.",
    description:
      "Acest concept este adăugat pentru previzualizarea paginii Proiecte. Folosește carnetul din demonstrația de magazin online și nu reprezintă o lucrare livrată unui client.",
    approach:
      "O compoziție luminoasă pune produsul, informațiile și alegerea variantei în aceeași pagină. Preview-ul este static; prețul și opțiunile sunt date de exemplu.",
    scope: [
      "Compoziție de prezentare",
      "Exemplu de pagină de produs",
      "Preview desktop",
    ],
    note: "Concept demonstrativ pentru previzualizarea arhivei. Fără client sau comenzi reale.",
    tone: "light",
  },
];

export const archiveProjects: readonly Project[] = [
  ...projects,
  ...archiveExamples,
];
