"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { Project } from "@/lib/projects";
import { ProjectMedia } from "./project-media";
import { Arrow } from "./icons";

gsap.registerPlugin(ScrollTrigger, useGSAP);
const perspectives = [
  { id: "ansamblu", label: "Ansamblu" },
  { id: "navigare", label: "Navigare" },
  { id: "contact", label: "Acțiune" },
] as const;
type Perspective = (typeof perspectives)[number]["id"];

function Detail({ project, view }: { project: Project; view: Perspective }) {
  return (
    <div className="website-detail-frame">
      <div className="website-detail-canvas" data-crop={view}>
        <ProjectMedia media={project.media} title={project.title} />
      </div>
    </div>
  );
}

export function WebsiteStory({ project }: { project: Project }) {
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState<Perspective>("ansamblu");
  useEffect(() => {
    const sections = [
      ...(root.current?.querySelectorAll<HTMLElement>("[data-website-step]") ||
        []),
    ];
    const observer = new IntersectionObserver(
      () => {
        const current = sections.reduce(
          (value, section) =>
            section.getBoundingClientRect().top <= innerHeight * 0.45
              ? (section.dataset.websiteStep as Perspective)
              : value,
          "ansamblu" as Perspective,
        );
        setActive(current);
      },
      { rootMargin: "-15% 0px -55% 0px", threshold: [0, 0.01] },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);
  useGSAP(
    () => {
      const media = gsap.matchMedia();
      media.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.utils
          .toArray<HTMLElement>(".website-step-title")
          .forEach((title) => {
            gsap.from(title.querySelectorAll(".website-title-line > span"), {
              yPercent: 105,
              duration: 0.75,
              stagger: 0.06,
              ease: "power4.out",
              scrollTrigger: { trigger: title, start: "top 90%", once: true },
              clearProps: "transform",
            });
          });
        let disposed = false;
        document.fonts.ready.then(() => {
          if (!disposed) ScrollTrigger.refresh();
        });
        return () => {
          disposed = true;
        };
      });
      return () => media.revert();
    },
    { scope: root },
  );
  return (
    <section
      className="website-story gutter"
      ref={root}
      aria-label="Un website privit de aproape"
    >
      <header
        className="website-opening website-step"
        id="website-ansamblu"
        data-website-step="ansamblu"
      >
        <nav className="website-breadcrumb" aria-label="Traseu pagină">
          <a href="/servicii">Servicii</a>
          <span aria-hidden="true">/</span>
          <span aria-current="page">Website-uri</span>
        </nav>
        <h1 className="website-step-title">
          <span className="website-title-line">
            <span>Website-uri</span>
          </span>
          <span className="website-title-line website-title-subline">
            <span>de prezentare.</span>
          </span>
        </h1>
        <p className="website-opening-description">
          Un site care arată ce faci, ce oferi și cum pot ajunge oamenii la
          tine.
        </p>
        <a className="website-contact-action" href="/contact">
          Vorbim despre site-ul tău <Arrow diagonal />
        </a>
        <div className="website-opening-observation">
          <h2>Identitatea, din primul ecran.</h2>
          <p>
            În {project.title}, fotografia ocupă centrul paginii. Titlul și
            culorile susțin aceeași direcție vizuală.
          </p>
        </div>
      </header>
      <div className="website-story-visual">
        <div className="website-visual-sticky">
          <figure className="website-project">
            <div className="website-project-context">
              <span>
                {project.title} / {project.serviceLabel}
              </span>
              <span>{project.status}</span>
            </div>
            <div className="website-focus-frame">
              <div className="website-focus-canvas" data-view={active}>
                <ProjectMedia media={project.media} title={project.title} />
              </div>
            </div>
            <figcaption className="website-project-caption">
              <span>Un website privit de aproape.</span>
              <a href={`/proiecte/${project.slug}`}>
                Vezi proiectul {project.title} <Arrow diagonal />
              </a>
            </figcaption>
          </figure>
          <p className="website-mobile-observation">
            În {project.title}, fotografia ocupă centrul paginii. Titlul și
            culorile susțin aceeași direcție vizuală.
          </p>
          <nav
            className="website-perspectives"
            aria-label="Perspective asupra proiectului"
          >
            {perspectives.map((perspective) => (
              <a
                href={`#website-${perspective.id}`}
                key={perspective.id}
                aria-current={
                  active === perspective.id ? "location" : undefined
                }
                onClick={() => setActive(perspective.id)}
              >
                <span aria-hidden="true" />
                {perspective.label}
              </a>
            ))}
          </nav>
        </div>
      </div>
      <section
        className="website-step website-navigation"
        id="website-navigare"
        data-website-step="navigare"
        aria-labelledby="website-navigation-title"
      >
        <div className="website-step-copy">
          <span className="website-perspective-note">Conținut & orientare</span>
          <h2 id="website-navigation-title" className="website-step-title">
            <span className="website-title-line">
              <span>Informația,</span>
            </span>
            <span className="website-title-line">
              <span>la locul ei.</span>
            </span>
          </h2>
          <p>
            Serviciile, portofoliul, echipa și contactul au locuri distincte în
            meniul {project.title}. Vizitatorul vede unde poate găsi informația
            de care are nevoie.
          </p>
        </div>
        <Detail project={project} view="navigare" />
      </section>
      <section
        className="website-step website-next-step"
        id="website-contact"
        data-website-step="contact"
        aria-labelledby="website-next-title"
      >
        <div className="website-step-copy">
          <span className="website-perspective-note">Următorul pas</span>
          <h2 id="website-next-title" className="website-step-title">
            <span className="website-title-line">
              <span>De aici,</span>
            </span>
            <span className="website-title-line">
              <span>spre contact.</span>
            </span>
          </h2>
          <p>
            Butonul „Vorbește cu noi” și accesul la „Programări” sunt vizibile
            în primul ecran. Prezentarea afacerii continuă cu o acțiune clară.
          </p>
        </div>
        <Detail project={project} view="contact" />
      </section>
    </section>
  );
}
