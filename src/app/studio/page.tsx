import type { Metadata } from "next";
import { Arrow } from "@/components/icons";
import { EditorialMotion } from "@/components/editorial-motion";
import { StudioNotes } from "@/components/studio-notes";

export const metadata: Metadata = {
  title: "Studio — CODELAB",
  description:
    "CODELAB, agenție de web design și dezvoltare din București. Lucrezi direct cu oamenii care se ocupă de proiectul tău.",
};

export default function StudioPage() {
  return (
    <main id="main" className="studio-page studio-portrait">
      <EditorialMotion page="studio-portrait">
        <header className="studio-portrait-opening gutter">
          <div className="studio-portrait-topline">
            <span>Studio</span>
            <span>CODELAB · București, RO</span>
          </div>
          <div className="studio-portrait-opening-grid">
            <h1>
              <span className="studio-portrait-intro">Suntem CODELAB.</span>
              <span className="studio-portrait-display">Design și cod,</span>
              <span className="studio-portrait-display studio-portrait-indent">
                împreună.
              </span>
            </h1>
            <div className="studio-portrait-opening-copy">
              <p>
                Agenție de web design și dezvoltare din București. Designul și
                dezvoltarea proiectului tău rămân în aceeași echipă.
              </p>
              <a href="/servicii" className="studio-portrait-link">
                Ce putem construi <Arrow diagonal />
              </a>
            </div>
          </div>
        </header>

        <section
          className="studio-portrait-story gutter"
          aria-labelledby="studio-story-title"
        >
          <div className="studio-portrait-margin">
            <span className="studio-portrait-label">
              Colaborarea cu CODELAB
            </span>
            <h2 id="studio-story-title">
              <span className="studio-portrait-mask">
                <span data-enter>Lucrezi direct</span>
              </span>
              <span className="studio-portrait-mask">
                <span data-enter>cu noi.</span>
              </span>
            </h2>
          </div>
          <div className="studio-portrait-reading" data-enter>
            <p>
              Pornim de la ce ai nevoie să facă proiectul. Discutăm structura,
              stabilim o direcție și construim pe baza ei.
            </p>
            <p className="studio-reading-lead">
              Pe parcurs, vezi paginile și poți încerca interacțiunile.
            </p>
            <p>Discutăm pe ceva concret, apoi ajustăm ce trebuie.</p>
            <a href="/proiecte" className="studio-portrait-link">
              Vezi proiectele <Arrow diagonal />
            </a>
          </div>
        </section>

        <StudioNotes />

        <section
          className="studio-portrait-contact gutter"
          aria-labelledby="studio-contact-title"
        >
          <span className="studio-portrait-label">Despre proiectul tău</span>
          <h2 id="studio-contact-title" data-enter>
            Spune-ne ce
            <br />
            ai în minte.
          </h2>
          <div>
            <p>Spune-ne de unde pornești și ce ai vrea să construim.</p>
            <a href="/contact" className="studio-portrait-link">
              Pregătește un brief <Arrow diagonal />
            </a>
          </div>
        </section>
      </EditorialMotion>
    </main>
  );
}
