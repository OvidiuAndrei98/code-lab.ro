import type { Project } from "@/lib/projects";
import { ProjectMedia } from "./project-media";
import { Arrow } from "./icons";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <article className="portfolio-card" data-work-card>
      <div className="portfolio-card-surface" data-work-surface>
        <a
          href={`/proiecte/${project.slug}`}
          className="portfolio-destination"
          aria-label={`Descoperă proiectul ${project.title}`}
        >
          <ProjectMedia media={project.media} title={project.title} />
          <div className="portfolio-caption">
            <div>
              <h3>{project.title}</h3>
              <p>
                {project.serviceLabel} <span>— {project.status}</span>
              </p>
            </div>
            <span className="portfolio-card-action">
              Vezi proiectul <Arrow diagonal />
            </span>
          </div>
        </a>
      </div>
    </article>
  );
}
