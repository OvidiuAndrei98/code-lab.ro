"use client";
import { useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
gsap.registerPlugin(ScrollTrigger, useGSAP);

export function EditorialMotion({
  children,
  page,
}: {
  children: ReactNode;
  page: string;
}) {
  const root = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      const media = gsap.matchMedia();
      media.add("(prefers-reduced-motion: no-preference)", () => {
        const container = root.current;
        if (!container) return;
        container.classList.add("editorial-motion-enabled");
        gsap.utils.toArray<HTMLElement>("[data-enter]").forEach((element) => {
          gsap.from(element, {
            y: 26,
            opacity: 0,
            duration: 0.75,
            ease: "power3.out",
            scrollTrigger: { trigger: element, start: "top 94%", once: true },
            clearProps: "transform,opacity",
          });
        });
        gsap.utils
          .toArray<HTMLElement>("[data-media-reveal], [data-chapter-media]")
          .forEach((element, index) => {
            gsap.fromTo(
              element,
              { y: 44, scale: 0.975 },
              {
                y: 0,
                scale: 1,
                ease: "none",
                scrollTrigger: {
                  id: `${page}-media-${index}`,
                  trigger: element,
                  start: "top 98%",
                  end: "top 43%",
                  scrub: 0.5,
                },
              },
            );
          });
        gsap.utils
          .toArray<HTMLElement>("[data-work-name]")
          .forEach((name, index) => {
            gsap.fromTo(
              name,
              { xPercent: -5 },
              {
                xPercent: 0,
                ease: "none",
                scrollTrigger: {
                  id: `${page}-title-${index}`,
                  trigger: name.closest("[data-work-card]"),
                  start: "top 95%",
                  end: "bottom 80%",
                  scrub: 0.5,
                },
              },
            );
          });
        const desktop = gsap.matchMedia();
        desktop.add("(min-width: 900px) and (min-height: 740px)", () => {
          const stacks = [
            ...container.querySelectorAll<HTMLElement>("[data-work-stack]"),
          ];
          let stackContext: gsap.Context | undefined;
          let frame = 0;
          const build = () => {
            stackContext?.revert();
            const layouts = stacks.map((stack) => {
              const cards = [
                ...stack.querySelectorAll<HTMLElement>("[data-work-card]"),
              ];
              return {
                stack,
                cards,
                fits:
                  cards.length > 1 &&
                  cards.every((card) => card.offsetHeight <= innerHeight - 130),
              };
            });
            stackContext = gsap.context(() => {
              layouts.forEach(({ stack, cards, fits }, stackIndex) => {
                if (!fits) return;
                stack.classList.add("work-stack-ready");
                cards.slice(0, -1).forEach((card, index) => {
                  const surface = card.querySelector("[data-work-surface]");
                  if (!surface) return;
                  gsap.to(surface, {
                    scale: 0.96,
                    opacity: 0.5,
                    ease: "none",
                    scrollTrigger: {
                      id: `${page}-handoff-${stackIndex}-${index}`,
                      trigger: cards[index + 1],
                      start: "top 85%",
                      end: "top 24%",
                      scrub: 0.5,
                    },
                  });
                });
              });
              return () =>
                stacks.forEach((stack) =>
                  stack.classList.remove("work-stack-ready"),
                );
            }, container);
            ScrollTrigger.refresh();
          };
          const schedule = () => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(build);
          };
          const observer = new ResizeObserver(schedule);
          stacks.forEach((stack) => observer.observe(stack));
          addEventListener("resize", schedule);
          build();
          return () => {
            cancelAnimationFrame(frame);
            observer.disconnect();
            removeEventListener("resize", schedule);
            stackContext?.revert();
          };
        });
        let disposed = false;
        document.fonts.ready.then(() => {
          if (!disposed) ScrollTrigger.refresh();
        });
        return () => {
          disposed = true;
          desktop.revert();
          container.classList.remove("editorial-motion-enabled");
        };
      });
      return () => media.revert();
    },
    { scope: root, dependencies: [page], revertOnUpdate: true },
  );
  return (
    <div className={`editorial-page editorial-${page}`} ref={root}>
      {children}
    </div>
  );
}
