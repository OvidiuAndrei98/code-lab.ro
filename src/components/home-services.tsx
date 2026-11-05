"use client";
import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { services } from "@/lib/services";
import { serviceProgress } from "@/lib/service-progress";
import { Arrow } from "./icons";
import styles from "./home-services.module.css";

gsap.registerPlugin(ScrollTrigger, useGSAP);
const lines = [["Website-uri"], ["Magazine", "online"], ["Aplicații", "web"]];
const descriptions = [
  "Ce faci, ce oferi și cum pot ajunge oamenii la tine. Într-un site gândit pentru afacerea ta.",
  "De la catalog și variante de produs, la coș, plată și administrarea comenzilor.",
  "Programări, conturi de client sau instrumente pentru echipă. Funcționalități construite pentru ce ai de făcut.",
];
const actions = ["Despre website-uri", "Despre magazine", "Despre aplicații"];

export function HomeServices() {
  const root = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      const section = root.current!;
      const titles = [
        ...section.querySelectorAll<HTMLElement>(
          "[data-offer] h3 span:first-child",
        ),
      ];
      const articles = [
        ...section.querySelectorAll<HTMLElement>("[data-offer]"),
      ];
      const ticks = [
        ...section.querySelectorAll<HTMLElement>("[data-service-tick]"),
      ];
      const links = [
        ...section.querySelectorAll<HTMLAnchorElement>("[data-service-label]"),
      ];
      const indicator = section.querySelector<HTMLElement>(
        "[data-service-indicator]",
      )!;
      const preference = matchMedia("(prefers-reduced-motion: reduce)");
      const style = getComputedStyle(section);
      const idle = style.getPropertyValue("--line").trim();
      const neutral = style.getPropertyValue("--muted").trim();
      const color = gsap.utils.interpolate(idle, neutral);
      const scrollPadding =
        parseFloat(
          getComputedStyle(document.documentElement).scrollPaddingTop,
        ) || 0;
      let marks = [0, 1, 2],
        offsets = Array.from({ length: 9 }, (_, i) => i * 11.75);
      let tickSpacing = 11.75,
        end = 1,
        current = -1;
      let disposed = false,
        refreshFrame = 0;
      const measure = () => {
        // Only refresh reads layout. The title centers and native anchor
        // destinations keep the same 47% focus reference as before.
        const focus = Math.round(innerHeight * 0.47);
        marks = titles.map((title) => {
          const box = title.getBoundingClientRect();
          return Math.round(box.top + scrollY + box.height / 2 - focus);
        });
        end = articles[2].getBoundingClientRect().bottom + scrollY;
        section.dataset.serviceMarks = JSON.stringify(marks);
        section.dataset.serviceFocus = String(focus);
        articles.forEach((article, i) => {
          const top = article.getBoundingClientRect().top + scrollY;
          article.style.scrollMarginTop = `${top - marks[i] - scrollPadding - (preference.matches ? 0 : 36)}px`;
        });
        const centers = links.map(
          (link) => link.offsetTop + link.offsetHeight / 2,
        );
        offsets = ticks.map((tick, i) => {
          const segment = Math.min(1, Math.floor(i / 4));
          const y =
            gsap.utils.interpolate(
              centers[segment],
              centers[segment + 1],
              (i - segment * 4) / 4,
            ) - centers[0];
          tick.style.top = `${y}px`;
          return y;
        });
        tickSpacing =
          Math.min(...offsets.slice(1).map((y, i) => y - offsets[i])) || 1;
      };
      const render = () => {
        const state = serviceProgress(scrollY, marks);
        const y = preference.matches
          ? offsets[state.active * 4]
          : gsap.utils.interpolate(
              offsets[state.segment * 4],
              offsets[(state.segment + 1) * 4],
              state.local,
            );
        // One persistent orange stroke physically travels between the marks.
        // Gray neighbors respond to its actual distance, never turning accent.
        indicator.style.transform = `translate3d(0, ${y}px, 0)`;
        ticks.forEach((tick, i) => {
          const weight = preference.matches
            ? 0
            : Math.max(0, 1 - Math.abs(y - offsets[i]) / tickSpacing);
          const principal = i % 4 === 0;
          tick.style.transform = `scaleX(${(principal ? 16 : 8) + weight * (principal ? 2 : 3)})`;
          tick.style.backgroundColor = color(weight * 0.5);
          tick.dataset.progressWeight = weight.toFixed(5);
        });
        section.dataset.servicePosition = state.position.toFixed(5);
        section.dataset.serviceProgress = state.progress.toFixed(6);
        section.dataset.serviceLocal = state.local.toFixed(6);
        section.dataset.serviceSegment = String(state.segment);
        section.dataset.rulerPosition = y.toFixed(5);
        if (state.active !== current) {
          current = state.active;
          section.dataset.serviceActive = services[current].id;
          links.forEach((link, index) => {
            if (index === current)
              link.setAttribute("aria-current", "location");
            else link.removeAttribute("aria-current");
          });
        }
      };
      measure();
      const trigger = ScrollTrigger.create({
        id: "home-service-ruler",
        trigger: section,
        start: () =>
          Math.min(
            marks[0] - innerHeight,
            section.getBoundingClientRect().top + scrollY - innerHeight,
          ),
        end: () => end,
        onRefreshInit: measure,
        onRefresh: render,
        onUpdate: render,
      });
      render();
      section.dataset.serviceReady = "";
      const refresh = () => {
        if (disposed || refreshFrame) return;
        refreshFrame = requestAnimationFrame(() => {
          refreshFrame = 0;
          if (!disposed) trigger.refresh();
        });
      };
      const observer = new ResizeObserver(refresh);
      observer.observe(section);
      titles.forEach((title) => observer.observe(title));
      links.forEach((link) => observer.observe(link));
      document.fonts.ready.then(refresh);
      document.fonts.addEventListener("loadingdone", refresh);
      preference.addEventListener("change", refresh);
      return () => {
        disposed = true;
        cancelAnimationFrame(refreshFrame);
        observer.disconnect();
        document.fonts.removeEventListener("loadingdone", refresh);
        preference.removeEventListener("change", refresh);
        trigger.kill();
        delete section.dataset.serviceReady;
        articles.forEach((article) =>
          article.style.removeProperty("scroll-margin-top"),
        );
      };
    },
    { scope: root },
  );

  return (
    <section
      className={`${styles.section} home-offer gutter`}
      ref={root}
      data-home-services
      aria-labelledby="home-offer-title"
    >
      <aside className={`${styles.context} offer-context`}>
        <div className={`${styles.contextSticky} offer-context-sticky`}>
          <h2 id="home-offer-title">Design & dezvoltare</h2>
          <p>Trei feluri în care putem construi pentru afacerea ta.</p>
          <nav
            className={`${styles.index} offer-index`}
            data-service-index
            aria-label="Serviciile CODELAB"
          >
            <div className={styles.rail} aria-hidden="true">
              {Array.from({ length: 9 }, (_, i) => (
                <span
                  className={styles.tick}
                  data-service-tick={i}
                  key={i}
                  style={{
                    top: `${i * 11.75}px`,
                    transform: `scaleX(${i % 4 === 0 ? 16 : 8})`,
                  }}
                />
              ))}
              <span
                className={styles.indicator}
                data-service-indicator
                style={{ transform: "translate3d(0, 0, 0)" }}
              />
            </div>
            {services.map((service, index) => (
              <a
                href={`#home-${service.id}`}
                key={service.id}
                data-service-label
                aria-current={index === 0 ? "location" : undefined}
              >
                {index === 1 ? "Magazine online" : service.title}
              </a>
            ))}
          </nav>
          <a href="/servicii" className={`${styles.all} offer-all`}>
            Toate serviciile <Arrow diagonal />
          </a>
        </div>
      </aside>
      <div className={`${styles.sequence} offer-sequence`}>
        {services.map((service, index) => (
          <article
            className={`${styles.article} offer-article offer-${service.id}`}
            id={`home-${service.id}`}
            data-offer={service.id}
            key={service.id}
            aria-labelledby={`home-${service.id}-title`}
          >
            <h3
              className={`${styles.title} offer-title`}
              id={`home-${service.id}-title`}
            >
              <a className="offer-title-link" href={service.href}>
                {lines[index].map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </a>
            </h3>
            <div className={`${styles.detail} offer-detail`}>
              <p>{descriptions[index]}</p>
              <a
                href={service.href}
                className={`${styles.action} offer-details-link`}
              >
                {actions[index]} <Arrow diagonal />
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
