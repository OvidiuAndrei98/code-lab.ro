import type { Metadata } from "next";
import { ProjectGallery } from "@/components/project-gallery";
import { Arrow } from "@/components/icons";
import { archiveProjects } from "@/lib/projects";
import styles from "./projects-page.module.css";

export const metadata: Metadata = { title: "Proiecte — CODELAB" };
export default function ProjectsPage() {
  return (
    <main id="main" className={`projects-page ${styles.page}`}>
      <header className={`gutter ${styles.introduction}`}>
        <h1>Proiecte</h1>
        <p>Proiecte în lucru și concepte de studio.</p>
      </header>
      <ProjectGallery projects={archiveProjects} />
      <section
        className={`gutter ${styles.closing}`}
        aria-labelledby="projects-contact"
      >
        <h2 id="projects-contact">Vorbim despre proiectul tău.</h2>
        <a className={styles.contactLink} href="/contact">
          <span>Pregătește un brief</span>
          <Arrow diagonal />
        </a>
      </section>
    </main>
  );
}
