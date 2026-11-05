"use client";

import { useRef, type MouseEventHandler } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { CodelabWordmark } from "./codelab-wordmark";
import { Arrow } from "./icons";
import { FooterNavigationLink } from "./footer-navigation-link";
import styles from "./site-footer.module.css";

gsap.registerPlugin(ScrollTrigger, useGSAP);

type FooterProps = {
  pathname: string;
  navigation: readonly { href: string; label: string }[];
  onBackToTop: MouseEventHandler<HTMLAnchorElement>;
};

export function SiteFooter({ pathname, navigation, onBackToTop }: FooterProps) {
  const footer = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      const media = gsap.matchMedia();
      media.add("(prefers-reduced-motion: no-preference)", () => {
        const mark = footer.current?.querySelector("[data-footer-mark]");
        if (!mark) return;
        const entrance = gsap.from(mark, {
          yPercent: 8,
          opacity: 0,
          duration: 0.65,
          ease: "power3.out",
          clearProps: "transform,opacity",
          scrollTrigger: {
            id: "footer-signature",
            trigger: mark.parentElement,
            start: "clamp(top 95%)",
            once: true,
          },
        });
        // Forms and demos can change the page height before the footer appears.
        // Refresh this trigger against the new layout, rather than its old offset.
        let frame = 0;
        const observer = new ResizeObserver(() => {
          if (entrance.progress() === 1) return;
          cancelAnimationFrame(frame);
          frame = requestAnimationFrame(() =>
            entrance.scrollTrigger?.refresh(),
          );
        });
        const surface = footer.current?.parentElement;
        if (surface) observer.observe(surface);
        return () => {
          observer.disconnect();
          cancelAnimationFrame(frame);
        };
      });
      return () => media.revert();
    },
    { scope: footer, dependencies: [pathname], revertOnUpdate: true },
  );

  return (
    <footer className={`site-footer ${styles.footer}`} ref={footer}>
      <div className={styles.top}>
        <div className={styles.information}>
          <p>Design și dezvoltare web.</p>
          <p>București, România.</p>
        </div>
        <a className={styles.backTop} href="#top" onClick={onBackToTop}>
          <span>Înapoi sus</span>
          <Arrow />
        </a>
      </div>
      <div className={styles.body}>
        <a className={styles.signature} href="/" aria-label="CODELAB — Acasă">
          <CodelabWordmark className={styles.wordmark} />
        </a>
        <nav className={styles.navigation} aria-label="Navigare în footer">
          <ul>
            {navigation
              .filter((item) => item.href !== "/")
              .map(({ href, label }) => (
                <li key={href}>
                  <FooterNavigationLink
                    href={href}
                    label={label}
                    current={
                      pathname === href
                        ? "page"
                        : pathname.startsWith(href + "/")
                          ? "location"
                          : undefined
                    }
                  />
                </li>
              ))}
          </ul>
        </nav>
      </div>
      <div className={styles.meta}>
        <span>© {new Date().getFullYear()} CODELAB</span>
      </div>
    </footer>
  );
}
