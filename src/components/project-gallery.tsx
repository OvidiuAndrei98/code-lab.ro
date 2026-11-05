"use client";

import {
  useEffect,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
} from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import type { Project } from "@/lib/projects";
import { ProjectMedia } from "./project-media";
import { Arrow } from "./icons";
import styles from "./project-gallery.module.css";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const desktopQuery =
  "(min-width: 1000px) and (min-height: 760px) and (pointer: fine) and (prefers-reduced-motion: no-preference)";
type GalleryController = {
  show: (index: number) => void;
  needsReveal: (index: number) => boolean;
};

/** A load event alone also fires for empty/error documents. Wait for the real preview. */
function waitForFrame(frame: HTMLIFrameElement, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    let checking = false;
    const expected = new URL(frame.src, location.href).href;
    const cleanup = () => {
      frame.removeEventListener("load", check);
      frame.removeEventListener("error", fail);
      signal.removeEventListener("abort", fail);
    };
    const fail = () => {
      cleanup();
      reject(new Error("Preview unavailable"));
    };
    async function check() {
      if (checking || signal.aborted) return;
      try {
        const doc = frame.contentDocument;
        if (!doc || doc.URL !== expected || doc.readyState !== "complete")
          return;
        checking = true;
        await doc.fonts.ready;
        const images = [...doc.images];
        if (!images.length) throw new Error("Preview image unavailable");
        await Promise.all(images.map((image) => image.decode()));
        if (images.some((image) => !image.complete || image.naturalWidth === 0))
          throw new Error("Preview image unavailable");
        if (signal.aborted) return;
        cleanup();
        resolve();
      } catch {
        fail();
      }
    }
    frame.addEventListener("load", check);
    frame.addEventListener("error", fail);
    signal.addEventListener("abort", fail, { once: true });
    void check();
  });
}

export function ProjectGallery({ projects }: { projects: readonly Project[] }) {
  const root = useRef<HTMLElement>(null);
  const controller = useRef<GalleryController | null>(null);
  const pointerFocus = useRef(false);
  const focusFrame = useRef(0);
  const [readiness, setReadiness] = useState("loading");
  const [wideLayout, setWideLayout] = useState(false);
  const collectionKey = projects.map((project) => project.slug).join("|");

  useEffect(() => () => cancelAnimationFrame(focusFrame.current), []);

  useEffect(() => {
    const query = matchMedia(desktopQuery);
    const update = () => setWideLayout(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const container = root.current;
    if (!container) return;
    const abort = new AbortController();
    setReadiness("loading");
    Promise.all([
      document.fonts.ready,
      ...[...container.querySelectorAll<HTMLIFrameElement>("iframe")].map(
        (frame) => waitForFrame(frame, abort.signal),
      ),
      ...[...container.querySelectorAll<HTMLImageElement>("img")].map((image) =>
        image.decode(),
      ),
    ])
      .then(() => {
        if (!abort.signal.aborted) setReadiness("ready");
      })
      .catch(() => {
        if (!abort.signal.aborted) setReadiness("failed");
      });
    return () => abort.abort();
  }, [collectionKey]);

  useGSAP(
    () => {
      const container = root.current;
      if (!container || !wideLayout || projects.length < 2) return;
      const track = container.querySelector<HTMLElement>(
        "[data-gallery-track]",
      )!;
      const articles = [
        ...container.querySelectorAll<HTMLElement>("[data-gallery-project]"),
      ];
      const bands = [
        ...container.querySelectorAll<HTMLElement>("[data-gallery-band]"),
      ];
      const links = [
        ...container.querySelectorAll<HTMLAnchorElement>(
          "[data-gallery-destination]",
        ),
      ];
      let context: gsap.Context | undefined;
      let timeline: gsap.core.Timeline | undefined;
      let resizeFrame = 0;
      let enabled = false;
      let top = 86;
      let panelHeight = 0;
      let rise = 0;
      let hold = 0;
      let distance = 0;
      let linkBottoms: number[] = [];

      const restoreAccessibility = () => {
        articles.forEach((article) => {
          article.inert = false;
          article.removeAttribute("aria-hidden");
          article.removeAttribute("data-covered");
        });
        links.forEach((link) => link.removeAttribute("tabindex"));
      };
      const measure = () => {
        // The header is in normal flow; only the compact fixed menu needs clearance.
        const menu = document.querySelector<HTMLElement>(".menu-trigger");
        top = Math.max(
          86,
          Math.round((menu?.getBoundingClientRect().bottom ?? 68) + 18),
        );
        container.style.setProperty("--gallery-top", `${top}px`);
        container.style.removeProperty("--gallery-band-height");
        const bandHeight = Math.ceil(
          Math.max(...bands.map((band) => band.offsetHeight), 110),
        );
        container.style.setProperty("--gallery-band-height", `${bandHeight}px`);
        const computed = getComputedStyle(container);
        const contentWidth =
          container.clientWidth -
          parseFloat(computed.paddingLeft) -
          parseFloat(computed.paddingRight);
        const width = Math.min(
          contentWidth,
          ((innerHeight - top - 24 - bandHeight) * 16) / 9,
        );
        container.style.setProperty(
          "--gallery-panel-width",
          `${Math.max(0, width)}px`,
        );
        panelHeight = bandHeight + (width * 9) / 16;
        rise = innerHeight - top + 16;
        hold = innerHeight * 0.18;
        distance = hold + (articles.length - 1) * (rise + hold);
        container.style.setProperty(
          "--gallery-panel-height",
          `${panelHeight}px`,
        );
        container.style.setProperty(
          "--gallery-track-height",
          `${panelHeight + distance}px`,
        );
        linkBottoms = links.map(
          (link, index) =>
            link.getBoundingClientRect().bottom -
            bands[index].getBoundingClientRect().top,
        );
        container.dataset.galleryDistance = String(distance);
        container.dataset.galleryRise = String(rise);
        container.dataset.galleryHoldDistance = String(hold);
        container.dataset.galleryPanelHeight = String(panelHeight);
        return width >= 620 && panelHeight - bandHeight >= 320;
      };
      const arrival = (index: number) => index * (rise + hold);
      const offsetAt = (index: number, travelled: number) =>
        index === 0
          ? 0
          : Math.max(
              0,
              Math.min(
                rise,
                rise - (travelled - hold - (index - 1) * (rise + hold)),
              ),
            );
      const updateAccessibility = (travelled: number) => {
        let resting = 0;
        articles.forEach((article, index) => {
          const ownY = offsetAt(index, travelled);
          const laterYs = articles
            .slice(index + 1)
            .map((_, item) => offsetAt(index + item + 1, travelled));
          const fullyCovered = ownY <= 0.01 && laterYs.some((y) => y <= 0.01);
          const linkCovered =
            ownY <= 0.01 && laterYs.some((y) => y < linkBottoms[index]);
          article.inert = fullyCovered;
          if (fullyCovered) article.setAttribute("aria-hidden", "true");
          else article.removeAttribute("aria-hidden");
          article.dataset.covered = fullyCovered
            ? "fully"
            : linkCovered
              ? "band"
              : "false";
          // Incoming offscreen destinations stay discoverable; focus reveals their reading hold.
          if (linkCovered) links[index].tabIndex = -1;
          else links[index].removeAttribute("tabindex");
          if (ownY <= 0.01) resting = index;
        });
        container.dataset.galleryHold = projects[resting].slug;
      };
      const build = () => {
        context?.revert();
        restoreAccessibility();
        context = gsap.context(() => {
          const clock = { progress: 0 };
          timeline = gsap.timeline({
            scrollTrigger: {
              id: "project-gallery",
              trigger: track,
              start: () => `top ${top}px`,
              end: () => `+=${distance}`,
              scrub: true,
              invalidateOnRefresh: true,
              onRefresh: (self) => {
                container.dataset.galleryStart = String(self.start);
                updateAccessibility(self.progress * distance);
              },
              onUpdate: (self) => updateAccessibility(self.progress * distance),
            },
          });
          timeline.to(
            clock,
            { progress: 1, duration: distance, ease: "none" },
            0,
          );
          articles.slice(1).forEach((article, index) => {
            timeline!.fromTo(
              article,
              { y: rise },
              { y: 0, duration: rise, ease: "none", immediateRender: true },
              hold + index * (rise + hold),
            );
          });
          controller.current = {
            show(index) {
              const trigger = timeline?.scrollTrigger;
              if (!trigger) return;
              const target = trigger.start + arrival(index) + hold / 2;
              window.dispatchEvent(
                new CustomEvent("codelab:scroll-to", {
                  detail: { top: target, immediate: true },
                }),
              );
              ScrollTrigger.update();
              updateAccessibility(arrival(index) + hold / 2);
            },
            needsReveal(index) {
              const rect = articles[index].getBoundingClientRect();
              return (
                articles[index].inert ||
                links[index].tabIndex < 0 ||
                rect.top < top - 1 ||
                rect.bottom > innerHeight - 24
              );
            },
          };
        }, container);
        ScrollTrigger.refresh();
      };
      const enhance = () => {
        if (
          enabled ||
          readiness !== "ready" ||
          container.getBoundingClientRect().top < top
        )
          return;
        if (!measure()) return;
        enabled = true;
        container.dataset.enhanced = "true";
        build();
      };
      const onResize = () => {
        cancelAnimationFrame(resizeFrame);
        resizeFrame = requestAnimationFrame(() => {
          if (!measure()) return;
          if (enabled) build();
          else enhance();
        });
      };
      measure();
      enhance();
      addEventListener("scroll", enhance, { passive: true });
      addEventListener("resize", onResize);
      return () => {
        cancelAnimationFrame(resizeFrame);
        cancelAnimationFrame(focusFrame.current);
        removeEventListener("scroll", enhance);
        removeEventListener("resize", onResize);
        context?.revert();
        controller.current = null;
        restoreAccessibility();
        container.removeAttribute("data-enhanced");
        [
          "galleryStart",
          "galleryDistance",
          "galleryRise",
          "galleryHoldDistance",
          "galleryPanelHeight",
          "galleryHold",
        ].forEach((key) => delete container.dataset[key]);
        [
          "--gallery-top",
          "--gallery-band-height",
          "--gallery-panel-width",
          "--gallery-panel-height",
          "--gallery-track-height",
        ].forEach((property) => container.style.removeProperty(property));
      };
    },
    {
      scope: root,
      dependencies: [readiness, wideLayout, collectionKey],
      revertOnUpdate: true,
    },
  );

  const focusProject = (
    event: FocusEvent<HTMLAnchorElement>,
    index: number,
  ) => {
    cancelAnimationFrame(focusFrame.current);
    if (pointerFocus.current || !controller.current) return;
    const link = event.currentTarget;
    if (controller.current.needsReveal(index)) controller.current.show(index);
    // Native Tab can scroll before ScrollTrigger has updated the incoming panel.
    // Recheck once after both updates, through the same scroll owner, without a tween.
    focusFrame.current = requestAnimationFrame(() => {
      if (
        document.activeElement === link &&
        controller.current?.needsReveal(index)
      )
        controller.current.show(index);
    });
  };
  const onDestinationKeyDown = (
    event: KeyboardEvent<HTMLAnchorElement>,
    index: number,
  ) => {
    if (
      event.key !== "Tab" ||
      !controller.current ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey
    )
      return;
    const next = index + (event.shiftKey ? -1 : 1);
    if (next < 0 || next >= projects.length) return;
    event.preventDefault();
    controller.current.show(next);
    root.current
      ?.querySelectorAll<HTMLAnchorElement>("[data-gallery-destination]")
      [next]?.focus({ preventScroll: true });
  };

  return (
    <section
      className={`${styles.gallery} gutter`}
      aria-label="Proiecte și concepte de studio"
      ref={root}
      data-project-gallery
      data-gallery-ready={readiness}
      data-gallery-layout={wideLayout ? "wide" : undefined}
    >
      <div className={styles.track} data-gallery-track>
        <div className={styles.scene} data-gallery-scene>
          <div className={styles.projects}>
            {projects.map((project, index) => {
              // A shorter native FASON viewport keeps its original CTA whole in the wide crop.
              // Its document, assets, and the shared ProjectMedia component remain unchanged.
              const media =
                wideLayout &&
                project.slug === "fason" &&
                project.media.type === "html"
                  ? { ...project.media, height: 880 }
                  : project.media;
              return (
                <article
                  className={styles.project}
                  key={project.slug}
                  id={`gallery-${project.slug}`}
                  data-gallery-project={project.slug}
                  data-gallery-tone={project.tone}
                  aria-labelledby={`gallery-title-${project.slug}`}
                >
                  <header
                    className={styles.band}
                    data-gallery-band={project.slug}
                  >
                    <div className={styles.identity}>
                      <h2
                        id={`gallery-title-${project.slug}`}
                        data-gallery-title={project.slug}
                      >
                        {project.title}
                      </h2>
                    </div>
                    <div className={styles.facts}>
                      <p className={styles.category}>{project.serviceLabel}</p>
                      <p className={styles.status}>
                        {project.status}
                        {project.isDemo && <span>Fără client real</span>}
                      </p>
                    </div>
                    <a
                      className={styles.destination}
                      href={`/proiecte/${project.slug}`}
                      data-gallery-destination={project.slug}
                      onFocus={(event) => focusProject(event, index)}
                      onKeyDown={(event) => onDestinationKeyDown(event, index)}
                      onPointerDown={() => {
                        pointerFocus.current = true;
                      }}
                      onPointerUp={() => {
                        pointerFocus.current = false;
                      }}
                      onPointerCancel={() => {
                        pointerFocus.current = false;
                      }}
                      onBlur={() => {
                        pointerFocus.current = false;
                      }}
                    >
                      <span>
                        {project.isDemo
                          ? "Explorează conceptul"
                          : "Vezi proiectul"}
                      </span>
                      <Arrow diagonal />
                    </a>
                  </header>
                  <div
                    className={styles.layer}
                    data-gallery-layer={project.slug}
                  >
                    <ProjectMedia media={media} title={project.title} />
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
