import type { Project } from "@/lib/projects";
import { ProjectMedia } from "./project-media";
import { Arrow } from "./icons";

export function WorkDisplay({
  project,
  home = false,
}: {
  project: Project;
  home?: boolean;
}) {
  if (home) {
    return (
      <article className="showcase-project home-work-project" data-work-card>
        <div data-work-surface>
          <div className="work-display-top home-work-intro">
            <h3>{project.title}</h3>
            <span>{project.serviceLabel}</span>
            <span>{project.status}</span>
          </div>
          <a
            className="home-work-media"
            href={`/proiecte/${project.slug}`}
            aria-label={`Deschide proiectul ${project.title}`}
          >
            <ProjectMedia media={project.media} title={project.title} />
          </a>
          <div className="home-work-closing">
            <p>{project.summary}</p>
            <a
              className="showcase-link home-work-destination"
              href={`/proiecte/${project.slug}`}
            >
              Vezi proiectul <Arrow diagonal />
            </a>
          </div>
        </div>
      </article>
    );
  }
  return (
    <article className="work-display project-entry" data-work-card>
      <div className="work-display-surface" data-work-surface>
        <div className="work-display-top">
          <span>{project.serviceLabel}</span>
          <span>{project.status}</span>
        </div>
        <div className="work-display-body">
          <div className="work-display-aside">
            <span>{project.category}</span>
            <p>{project.discipline}</p>
          </div>
          <div className="work-display-frame" data-media-reveal>
            <a
              className="project-entry-image"
              href={`/proiecte/${project.slug}`}
              aria-label={`Deschide proiectul ${project.title}`}
            >
              <ProjectMedia media={project.media} title={project.title} />
            </a>
          </div>
        </div>
        <a
          className="portfolio-destination work-display-caption"
          href={`/proiecte/${project.slug}`}
          aria-label={`Descoperă proiectul ${project.title}`}
        >
          <h2 data-work-name>{project.title}</h2>
          <p>{project.summary}</p>
          <span className="work-display-action">
            Vezi proiectul
            <Arrow diagonal />
          </span>
        </a>
      </div>
    </article>
  );
}
