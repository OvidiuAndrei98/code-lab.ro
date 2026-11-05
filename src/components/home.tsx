import { Arrow } from "./icons";
import { WordmarkLetters } from "./codelab-wordmark";
import { WorkDisplay } from "./work-display";
import { EditorialMotion } from "./editorial-motion";
import { HomeContinuation } from "./home-continuation";
import { projects } from "@/lib/projects";
import { HydraulicPress } from "./hydraulic-press";
import { heroMotion } from "@/lib/hero-motion";

export function Home() {
  return (
    <main id="main">
      <div className="home-opening">
        <section
          className={`identity-section gutter${heroMotion === "hydraulic" ? " hydraulic-hero" : ""}`}
          aria-labelledby="identity-title"
        >
          <div className="identity-scene">
            {heroMotion === "hydraulic" && <HydraulicPress />}
            <div className="identity-top">
              <span>Design & dezvoltare web</span>
              <span>București, România</span>
            </div>
            <h1
              id="identity-title"
              className="identity-lockup"
              aria-label="CODELAB"
            >
              <WordmarkLetters />
            </h1>
            <div className="identity-bottom">
              <p>
                De la idee la lansare.
                <br />
                Cu atenție pentru fiecare detaliu.
              </p>
              <h2>
                Facem site-uri.
                <br />
                De la design la ultimul click.
              </h2>
              <a
                className="round-link"
                href="#proiect"
                aria-label="Vezi proiectul în lucru"
              >
                <span>
                  Vezi la ce
                  <br />
                  lucrăm
                </span>
                <span className="round-arrow">
                  <Arrow />
                </span>
              </a>
            </div>
          </div>
        </section>
        <section
          id="proiect"
          className="showcase-section gutter"
          aria-labelledby="work-title"
        >
          <EditorialMotion page="home-work">
            <div className="work-section-heading">
              <h2 id="work-title">
                <span className="work-title">Selected work</span>
              </h2>
              <a href="/proiecte" className="quiet-link">
                Toate proiectele <Arrow diagonal />
              </a>
            </div>
            <div className="work-display-list" data-work-stack>
              {projects.map((project) => (
                <WorkDisplay key={project.slug} project={project} home />
              ))}
            </div>
          </EditorialMotion>
        </section>
      </div>
      <HomeContinuation />
    </main>
  );
}
