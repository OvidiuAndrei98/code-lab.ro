import type { Metadata } from "next";
import { ProjectMedia } from "@/components/project-media";
import { EditorialMotion } from "@/components/editorial-motion";
import { notFound } from "next/navigation";
import { archiveProjects } from "@/lib/projects";
import { Arrow } from "@/components/icons";
export function generateStaticParams() {
  return archiveProjects.map((project) => ({ slug: project.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = archiveProjects.find((project) => project.slug === slug);
  return {
    title: project ? `${project.title} — CODELAB` : "Proiect — CODELAB",
  };
}
export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const index = archiveProjects.findIndex((project) => project.slug === slug);
  const project = archiveProjects[index];
  if (!project) notFound();
  const next = archiveProjects[index + 1];
  return (
    <main id="main" className={`case-page case-${project.slug}`}>
      <EditorialMotion page="case">
        <header className="case-intro gutter">
          <a className="case-back quiet-link" href="/proiecte">
            Toate proiectele
            <Arrow diagonal />
          </a>
          <div className="case-heading">
            <h1>{project.title}</h1>
            <div>
              <p>{project.category}</p>
              <span>{project.status}</span>
            </div>
          </div>
        </header>
        <div className="case-live-preview" data-media-reveal>
          <ProjectMedia media={project.media} title={project.title} />
        </div>
        <section
          className="case-brief gutter"
          aria-labelledby="case-brief-title"
        >
          <div data-enter>
            <h2 id="case-brief-title">{project.headline}</h2>
            <p>{project.description}</p>
          </div>
          <dl>
            <div>
              <dt>Ce construim</dt>
              <dd>
                <ul>
                  {project.scope.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </dd>
            </div>
            <div>
              <dt>Direcția proiectului</dt>
              <dd>{project.approach}</dd>
            </div>
            <div>
              <dt>Stare</dt>
              <dd>{project.note}</dd>
            </div>
          </dl>
        </section>
        <nav className="case-next gutter" aria-label="Continuă explorarea">
          <span>
            {next
              ? next.isDemo
                ? "Următorul exemplu"
                : "Următorul proiect"
              : "Continuă explorarea"}
          </span>
          <a href={next ? `/proiecte/${next.slug}` : "/proiecte"}>
            {next ? next.title : "Înapoi la proiecte"}
            <Arrow diagonal />
          </a>
        </nav>
      </EditorialMotion>
    </main>
  );
}
