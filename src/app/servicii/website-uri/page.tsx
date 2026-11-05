import type { Metadata } from "next";
import { WebsiteStory } from "@/components/website-story";
import { Arrow } from "@/components/icons";
import { projects } from "@/lib/projects";

export const metadata: Metadata = {
  title: "Website-uri de prezentare — CODELAB",
  description:
    "Website-uri de prezentare: structură, design personalizat, afișare pe desktop și mobil și formulare de contact. Vezi proiectul FASON, în lucru.",
};
const scope = [
  {
    title: "Structură & conținut",
    description:
      "Organizăm informațiile pe care ni le oferi: afacerea, serviciile și datele de contact.",
  },
  {
    title: "Design personalizat",
    description:
      "Stabilim direcția vizuală: tipografie, imagini, culori și felul în care se leagă paginile.",
  },
  {
    title: "Desktop & mobil",
    description:
      "Adaptăm layoutul și navigarea pentru dimensiuni diferite de ecran.",
  },
  {
    title: "Formulare de contact",
    description:
      "Pregătim un loc clar pentru întrebări și solicitări, în funcție de ce are nevoie site-ul.",
  },
];
export default function WebsiteServicePage() {
  const project = projects.find((project) => project.slug === "fason");
  return (
    <main id="main" className="website-service-page">
      {project ? (
        <WebsiteStory project={project} />
      ) : (
        <header className="gutter">
          <h1>Website-uri de prezentare.</h1>
        </header>
      )}
      <section
        className="website-includes gutter"
        aria-labelledby="website-includes-title"
      >
        <div className="website-includes-context">
          <span>Website de prezentare</span>
          <h2 id="website-includes-title">
            Ce intră
            <br />
            în proiect.
          </h2>
          <p>
            Pentru servicii, portofolii și afaceri care au nevoie de un loc clar
            online. Stabilim împreună ce pagini și funcționalități sunt
            necesare.
          </p>
        </div>
        <dl className="website-scope">
          {scope.map((item) => (
            <div key={item.title}>
              <dt>{item.title}</dt>
              <dd>{item.description}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section
        className="website-conversation gutter"
        aria-labelledby="website-conversation-title"
      >
        <h2 id="website-conversation-title">
          Despre
          <br />
          site-ul tău.
        </h2>
        <div>
          <p>
            Spune-ne ce face afacerea ta și ce ar trebui să poată face
            vizitatorii pe site. Pornim de aici cu un brief.
          </p>
          <a className="website-conversation-action" href="/contact">
            Pregătește un brief <Arrow diagonal />
          </a>
          <a className="website-more-projects" href="/proiecte">
            Vezi proiectele <Arrow diagonal />
          </a>
        </div>
      </section>
    </main>
  );
}
