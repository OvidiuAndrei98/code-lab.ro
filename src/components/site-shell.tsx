"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import Lenis from "lenis";
import { Arrow } from "./icons";
import { setupHydraulicHero } from "@/lib/hydraulic-hero";
import { setupHomeHandoff } from "@/lib/home-handoff";
import { syncNativeScrollbar } from "@/lib/native-scrollbar";
import { SiteFooter } from "./site-footer";
import { ReorderingLabel } from "./reordering-label";

gsap.registerPlugin(ScrollTrigger, useGSAP);
const navigation = [
  { href: "/", label: "Acasă" },
  { href: "/proiecte", label: "Proiecte" },
  { href: "/servicii", label: "Servicii" },
  { href: "/studio", label: "Studio" },
  { href: "/contact", label: "Contact" },
];

// Transform the original strokes around their own midpoints. Both diagonals
// finish at the same (40,25.5) reference without changing their stroke weight.
// Resting left caps advance 15 units right and down: parallel to the face cut.
const menuIconLines = [
  {
    selector: ".menu-tab-line--top",
    origin: "35.5 15.5",
    open: {
      x: 4.5,
      y: 10,
      rotation: 45,
      scaleX: 36 / 45,
      opacity: 1,
    },
    duration: 0.3,
  },
  {
    selector: ".menu-tab-line--middle",
    origin: "43 30.5",
    open: { x: -3, y: -5, rotation: 0, scaleX: 0, opacity: 0 },
    duration: 0.18,
  },
  {
    selector: ".menu-tab-line--bottom",
    origin: "50.5 45.5",
    open: {
      x: -10.5,
      y: -20,
      rotation: -45,
      scaleX: 36 / 15,
      opacity: 1,
    },
    duration: 0.3,
  },
];

function snapMenuTravel(value: string | number) {
  const pixels = typeof value === "number" ? value : parseFloat(value);
  const ratio = window.devicePixelRatio || 1;
  // Keep the paper backing from leaking through composited ink edges.
  return `${Math.round(pixels * ratio) / ratio}px`;
}

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const stage = useRef<HTMLDivElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const menuPanel = useRef<HTMLDivElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const header = useRef<HTMLElement>(null);
  const skip = useRef<HTMLAnchorElement>(null);
  const scroller = useRef<Lenis | null>(null);
  const menuMotion = useRef<gsap.core.Tween | null>(null);
  const menuContentMotion = useRef<gsap.core.Timeline | null>(null);
  const menuIconMotion = useRef<gsap.core.Timeline | null>(null);
  const menuTarget = useRef(false);
  const menuPresentRef = useRef(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPresent, setMenuPresent] = useState(false);
  const menuGeometry = useRef({
    edge: 0,
    tabWidth: 52,
    overlap: -1,
    hitOffset: -1,
  });

  const syncTabFit = useCallback(() => {
    if (!menu.current || !menuButton.current) return;
    const geometry = menuGeometry.current;
    const panelLeft =
      geometry.edge + Number(gsap.getProperty(menu.current, "x"));
    // A safety fit for unusually narrow layouts; the responsive panel normally
    // reserves the complete face, so it stays exactly attached without overlap.
    const overlap = Math.max(0, geometry.tabWidth + 1 - panelLeft);
    const hitOffset = Math.min(
      Math.max(0, 44 - geometry.tabWidth),
      Math.max(0, panelLeft - geometry.tabWidth),
    );
    if (Math.abs(overlap - geometry.overlap) > 0.001) {
      menuButton.current.style.setProperty(
        "--menu-tab-overlap",
        `${overlap}px`,
      );
      geometry.overlap = overlap;
    }
    if (Math.abs(hitOffset - geometry.hitOffset) > 0.001) {
      menuButton.current.style.setProperty(
        "--menu-hit-offset",
        `${hitOffset}px`,
      );
      geometry.hitOffset = hitOffset;
    }
  }, []);

  const finishMenuClose = useCallback((restoreFocus = true) => {
    menuPresentRef.current = false;
    menuTarget.current = false;
    setMenuOpen(false);
    setMenuPresent(false);
    if (menu.current) {
      menu.current.removeAttribute("data-menu-modal");
      menu.current.removeAttribute("role");
      menu.current.removeAttribute("aria-modal");
      menu.current.removeAttribute("aria-label");
    }
    if (menuPanel.current) {
      menuPanel.current.hidden = true;
      menuPanel.current.inert = true;
    }
    if (stage.current) stage.current.inert = false;
    if (skip.current) skip.current.inert = false;
    scroller.current?.start();
    if (restoreFocus) menuButton.current?.focus({ preventScroll: true });
  }, []);

  const syncMenuAxis = useCallback(() => {
    const logo = header.current?.querySelector(".logo");
    if (!logo || !menuButton.current) return;
    const bounds = logo.getBoundingClientRect();
    // Keep the control sticky at the header's resting axis after its logo
    // scrolls away, following any responsive or compact header height changes.
    const headerHeight = header.current?.getBoundingClientRect().height ?? 0;
    menuButton.current.style.setProperty(
      "--menu-control-axis",
      `${Math.max(headerHeight / 2, bounds.top + bounds.height / 2)}px`,
    );
    // offsetLeft is the layout edge before GSAP's translation. Unlike
    // clientWidth it keeps the reserved native scrollbar gutter while locked.
    const edge = menu.current?.offsetLeft ?? 0;
    if (menuGeometry.current.edge !== edge) {
      menuGeometry.current.edge = edge;
      menu.current?.style.setProperty("--menu-viewport-width", `${edge}px`);
    }
    menuGeometry.current.tabWidth = parseFloat(
      getComputedStyle(menuButton.current).getPropertyValue("--menu-tab-width"),
    );
    syncTabFit();
  }, [syncTabFit]);

  useGSAP(
    () => {
      syncMenuAxis();
      const observer = new ResizeObserver(syncMenuAxis);
      if (header.current) observer.observe(header.current);
      let disposed = false;
      document.fonts.ready.then(() => {
        if (!disposed) syncMenuAxis();
      });
      addEventListener("scroll", syncMenuAxis, { passive: true });
      addEventListener("resize", syncMenuAxis);
      return () => {
        disposed = true;
        observer.disconnect();
        removeEventListener("scroll", syncMenuAxis);
        removeEventListener("resize", syncMenuAxis);
      };
    },
    { dependencies: [pathname], revertOnUpdate: true },
  );

  function setIconImmediately(open: boolean) {
    menuIconLines.forEach((line) => {
      const element = menu.current?.querySelector(line.selector);
      if (!element) return;
      gsap.set(element, {
        svgOrigin: line.origin,
        ...(open
          ? line.open
          : { x: 0, y: 0, rotation: 0, scaleX: 1, opacity: 1 }),
        force3D: false,
      });
    });
  }

  useGSAP(
    () => {
      const media = gsap.matchMedia();
      media.add("(prefers-reduced-motion: no-preference)", () => {
        setIconImmediately(false);
        const icon = gsap.timeline({
          paused: true,
          defaults: { ease: "power3.out", force3D: false },
        });
        menuIconLines.forEach((line) => {
          icon.to(line.selector, { ...line.open, duration: line.duration }, 0);
        });
        menuIconMotion.current = icon;
        if (menuTarget.current) icon.progress(1).pause();
        const words = menu.current?.querySelectorAll(".menu-word-enter");
        const information = menu.current?.querySelector(".menu-bottom");
        if (!words?.length || !information) return;
        const content = gsap.timeline({ paused: true });
        content
          .fromTo(
            words,
            { yPercent: 110 },
            {
              yPercent: 0,
              duration: 0.36,
              stagger: 0.04,
              ease: "power3.out",
              force3D: false,
            },
            0.04,
          )
          .fromTo(
            information,
            { y: 8, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.2, ease: "power3.out" },
            0.32,
          );
        menuContentMotion.current = content;
        if (menuTarget.current) content.progress(1).pause();
        return () => {
          menuContentMotion.current = null;
          menuIconMotion.current = null;
        };
      });
      return () => media.revert();
    },
    { scope: menu, dependencies: [pathname], revertOnUpdate: true },
  );

  useEffect(() => {
    const root = document.documentElement;
    const desktop = matchMedia(
      "(hover: hover) and (pointer: fine) and (forced-colors: none)",
    );
    const updateScrollbar = syncNativeScrollbar;
    updateScrollbar();
    let observedWidth = root.getBoundingClientRect().width;
    const size = new ResizeObserver(([entry]) => {
      // Page height changes (forms/gallery) do not need another style probe.
      if (!entry || Math.abs(entry.contentRect.width - observedWidth) < 0.5)
        return;
      updateScrollbar();
      observedWidth = root.getBoundingClientRect().width;
    });
    size.observe(root);
    desktop.addEventListener("change", updateScrollbar);
    addEventListener("resize", updateScrollbar);
    addEventListener("focus", updateScrollbar);
    return () => {
      size.disconnect();
      desktop.removeEventListener("change", updateScrollbar);
      removeEventListener("resize", updateScrollbar);
      removeEventListener("focus", updateScrollbar);
      root.removeAttribute("data-classic-scrollbar");
      root.style.removeProperty("--native-scrollbar-size");
    };
  }, []);

  useGSAP(
    () => {
      const media = gsap.matchMedia();
      media.add("(prefers-reduced-motion: no-preference)", () => {
        const lenis = new Lenis({
          duration: 1.15,
          smoothWheel: true,
          syncTouch: false,
          anchors: { offset: -36 },
          prevent: (node) => !!node.closest("[data-menu-mechanism], dialog"),
        });
        scroller.current = lenis;
        if (menuPresentRef.current) lenis.stop();
        lenis.on("scroll", ScrollTrigger.update);
        const tick = (time: number) => lenis.raf(time * 1000);
        gsap.ticker.add(tick);
        gsap.ticker.lagSmoothing(0);
        const revertHydraulic = setupHydraulicHero(stage.current);
        gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((element) => {
          gsap.from(element, {
            y: 26,
            opacity: 0,
            duration: 0.75,
            ease: "power3.out",
            scrollTrigger: { trigger: element, start: "top 94%", once: true },
            clearProps: "transform,opacity",
          });
        });
        const revertHomeHandoff = setupHomeHandoff(stage.current);
        gsap.utils
          .toArray<HTMLElement>("[data-service-visual]")
          .forEach((visual) => {
            gsap.from(visual, {
              y: 28,
              duration: 0.85,
              ease: "power3.out",
              scrollTrigger: { trigger: visual, start: "top 92%", once: true },
              clearProps: "transform",
            });
          });
        gsap.utils
          .toArray<HTMLElement>(".home-services > a")
          .forEach((row, index) => {
            const line = row.querySelector(".service-rule");
            const title = row.querySelector(".service-name");
            const detail = row.querySelector(".service-summary");
            const arrow = row.querySelector("svg");
            if (!line || !title || !detail || !arrow) return;
            gsap
              .timeline({
                scrollTrigger: {
                  id: `service-reveal-${index}`,
                  trigger: row,
                  start: "top 93%",
                  once: true,
                },
              })
              .from(
                line,
                {
                  scaleX: 0,
                  duration: 0.6,
                  ease: "power3.out",
                  clearProps: "transform",
                },
                0,
              )
              .from(
                title,
                {
                  yPercent: 110,
                  duration: 0.8,
                  ease: "power4.out",
                  clearProps: "transform",
                },
                0.08,
              )
              .from(
                [detail, arrow],
                {
                  y: 12,
                  opacity: 0,
                  duration: 0.5,
                  stagger: 0.04,
                  ease: "power3.out",
                  clearProps: "transform,opacity",
                },
                0.2,
              );
          });
        let disposed = false;
        document.fonts.ready.then(() => {
          if (!disposed) ScrollTrigger.refresh();
        });
        return () => {
          disposed = true;
          revertHydraulic?.();
          revertHomeHandoff?.();
          gsap.ticker.remove(tick);
          lenis.destroy();
          scroller.current = null;
        };
      });
      return () => media.revert();
    },
    { scope: stage, dependencies: [pathname], revertOnUpdate: true },
  );

  useEffect(() => {
    const scrollToPosition = (event: Event) => {
      const detail = (event as CustomEvent<{ top?: unknown }>).detail;
      if (typeof detail?.top !== "number" || !Number.isFinite(detail.top))
        return;
      if (scroller.current) {
        scroller.current.resize();
        scroller.current.scrollTo(detail.top, { immediate: true });
      } else {
        window.scrollTo({ top: detail.top, behavior: "instant" });
      }
    };
    window.addEventListener("codelab:scroll-to", scrollToPosition);
    return () =>
      window.removeEventListener("codelab:scroll-to", scrollToPosition);
  }, []);

  useEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const resize = () => {
      if (
        !menuPresentRef.current ||
        !menu.current ||
        !menuPanel.current ||
        !stage.current
      )
        return;
      menuMotion.current?.kill();
      if (!menuTarget.current) {
        menuContentMotion.current?.pause(0);
        if (menuIconMotion.current) menuIconMotion.current.pause(0);
        else setIconImmediately(false);
        gsap.set([stage.current, menu.current], { x: 0 });
        syncTabFit();
        finishMenuClose();
        return;
      }
      const width = menuPanel.current.offsetWidth;
      const travel = snapMenuTravel(-width);
      gsap.set(stage.current, { x: reduced.matches ? 0 : travel });
      gsap.set(menu.current, { x: travel });
      syncTabFit();
      if (reduced.matches) setIconImmediately(true);
      menuContentMotion.current?.progress(1).pause();
    };
    addEventListener("resize", resize);
    reduced.addEventListener("change", resize);
    return () => {
      removeEventListener("resize", resize);
      reduced.removeEventListener("change", resize);
      menuMotion.current?.kill();
    };
  }, []);

  const closeMenu = useCallback(() => {
    if (
      !menuPresentRef.current ||
      !menu.current ||
      !menuPanel.current ||
      !stage.current ||
      !menuTarget.current
    )
      return;
    menuTarget.current = false;
    setMenuOpen(false);
    menuMotion.current?.kill();
    menuContentMotion.current?.timeScale(1.6).reverse();
    if (menuIconMotion.current) menuIconMotion.current.reverse();
    else setIconImmediately(false);
    menuMotion.current = gsap.to([stage.current, menu.current], {
      x: 0,
      duration: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? 0
        : Math.min(
            0.45,
            (0.45 * Math.abs(Number(gsap.getProperty(stage.current, "x")))) /
              menuPanel.current.offsetWidth,
          ),
      ease: "power3.out",
      modifiers: { x: snapMenuTravel },
      onUpdate: syncTabFit,
      onComplete: () => {
        if (menuTarget.current) return;
        menuContentMotion.current?.pause(0);
        finishMenuClose();
      },
    });
  }, [finishMenuClose, syncTabFit]);
  function openMenu(event: MouseEvent<HTMLButtonElement>) {
    if (
      !menu.current ||
      !menuPanel.current ||
      (menuPresentRef.current && menuTarget.current)
    )
      return;
    syncMenuAxis();
    scroller.current?.stop();
    const freshOpening = !menuPresentRef.current;
    menuPresentRef.current = true;
    menu.current.setAttribute("data-menu-modal", "");
    menu.current.setAttribute("role", "dialog");
    menu.current.setAttribute("aria-modal", "true");
    menu.current.setAttribute("aria-label", "Meniu principal");
    menuPanel.current.hidden = false;
    menuPanel.current.inert = false;
    if (stage.current) stage.current.inert = true;
    if (skip.current) skip.current.inert = true;
    setMenuPresent(true);
    // Pointer opening starts at the navigation, without selecting the close
    // control. Keyboard opening retains the native, visibly focused button.
    if (event.detail > 0)
      menu.current
        .querySelector<HTMLElement>("[data-menu-entry]")
        ?.focus({ preventScroll: true });
    else
      menu.current
        .querySelector<HTMLButtonElement>(".menu-tab")
        ?.focus({ preventScroll: true });
    // A fresh opening starts at the first destination after focus is settled,
    // rather than retaining the scroll position of a previously used last row.
    if (freshOpening) {
      const content = menu.current.querySelector(".menu-content");
      if (content) content.scrollTop = 0;
    }
    menuTarget.current = true;
    setMenuOpen(true);
    menuMotion.current?.kill();
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (menuIconMotion.current) menuIconMotion.current.play();
    else setIconImmediately(true);
    menuContentMotion.current?.timeScale(1).play();
    const width = menuPanel.current.offsetWidth;
    if (reduce) gsap.set(stage.current, { x: 0 });
    menuMotion.current = gsap.to(
      reduce ? menu.current : [stage.current!, menu.current],
      {
        x: -width,
        duration: reduce
          ? 0
          : Math.min(
              0.45,
              (0.45 *
                Math.abs(width + Number(gsap.getProperty(menu.current, "x")))) /
                width,
            ),
        ease: "power3.out",
        modifiers: { x: snapMenuTravel },
        onUpdate: syncTabFit,
      },
    );
  }

  function followMenuLink(event: MouseEvent<HTMLAnchorElement>) {
    // Re-selecting this exact destination dismisses the menu without reloading
    // the same page. Other URLs and modified activations remain native links.
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    if (event.currentTarget.href === location.href) {
      event.preventDefault();
      closeMenu();
      return;
    }
    // Native document navigation starts immediately. Settle the outgoing page
    // before the browser takes its sheet snapshot; never capture a pushed page
    // or delay following the destination until a closing animation finishes.
    menuTarget.current = false;
    menuMotion.current?.kill();
    menuContentMotion.current?.pause(0);
    gsap.set([stage.current, menu.current], { x: 0 });
    syncTabFit();
    setMenuOpen(false);
    setIconImmediately(false);
    finishMenuClose(false);
  }

  function backToTop(event: MouseEvent<HTMLAnchorElement>) {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    event.preventDefault();
    // This link uses the existing scroller directly, without its global anchor offset.
    event.stopPropagation();
    const focusStart = () =>
      stage.current
        ?.querySelector<HTMLAnchorElement>(".site-header .logo")
        ?.focus({ preventScroll: true });
    if (scroller.current) {
      scroller.current.scrollTo(0, { onComplete: focusStart });
    } else {
      window.scrollTo({ top: 0, behavior: "instant" });
      focusStart();
    }
  }

  return (
    <>
      <a className="skip-link" href="#main" ref={skip} inert={menuPresent}>
        Sari la conținut
      </a>
      <div
        className="menu-backdrop"
        aria-hidden="true"
        hidden={!menuPresent}
        onClick={closeMenu}
      />
      <div
        className="menu-mechanism"
        ref={menu}
        role={menuPresent ? "dialog" : undefined}
        aria-modal={menuPresent ? true : undefined}
        aria-label={menuPresent ? "Meniu principal" : undefined}
        data-menu-mechanism
        data-menu-modal={menuPresent ? "" : undefined}
        onKeyDown={(event) => {
          if (!menuPresentRef.current) return;
          if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            closeMenu();
            return;
          }
          if (event.key !== "Tab") return;
          const targets = event.currentTarget.querySelectorAll<HTMLElement>(
            "button:not(:disabled), a[href]",
          );
          const first = targets[0];
          const last = targets[targets.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
        }}
        data-lenis-prevent
      >
        <button
          className="menu-tab"
          ref={menuButton}
          type="button"
          aria-haspopup="dialog"
          aria-expanded={menuOpen}
          aria-controls="site-menu"
          aria-label={menuOpen ? "Închide meniul" : "Deschide meniul"}
          onClick={(event) => {
            event.stopPropagation();
            if (menuTarget.current) closeMenu();
            else openMenu(event);
          }}
          onDragStart={(event) => event.preventDefault()}
        >
          <svg
            className="menu-tab-graphic"
            viewBox="0 0 72 116"
            preserveAspectRatio="xMaxYMin meet"
            aria-hidden="true"
            focusable="false"
          >
            <path className="menu-tab-face" d="M0 0H72V116L0 44Z" />
            <g className="menu-tab-icon">
              <line
                className="menu-tab-line--top"
                x1="13"
                x2="58"
                y1="15.5"
                y2="15.5"
              />
              <line
                className="menu-tab-line--middle"
                x1="28"
                x2="58"
                y1="30.5"
                y2="30.5"
              />
              <line
                className="menu-tab-line--bottom"
                x1="43"
                x2="58"
                y1="45.5"
                y2="45.5"
              />
            </g>
          </svg>
        </button>
        <div
          id="site-menu"
          className="side-menu"
          ref={menuPanel}
          hidden={!menuPresent}
          inert={!menuPresent}
        >
          <div className="menu-top">
            <span className="menu-brand">
              code<span>lab</span>
            </span>
          </div>
          <div className="menu-content">
            <nav
              aria-label="Meniu extins"
              tabIndex={-1}
              data-menu-entry
              onFocusCapture={(event) => {
                if (event.target instanceof HTMLAnchorElement)
                  menuContentMotion.current?.progress(1).pause();
              }}
            >
              {navigation.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  aria-current={
                    pathname === item.href
                      ? "page"
                      : pathname.startsWith(item.href + "/")
                        ? "location"
                        : undefined
                  }
                  onClick={followMenuLink}
                >
                  <span className="menu-word-mask">
                    <span className="menu-word-enter">
                      <ReorderingLabel label={item.label} />
                      {item.href === "/contact" && <Arrow diagonal />}
                    </span>
                  </span>
                </a>
              ))}
            </nav>
            <div className="menu-bottom">
              <p>
                Design și dezvoltare web.
                <br />
                București, România.
              </p>
            </div>
          </div>
        </div>
      </div>
      <div
        id="top"
        className={`site-stage ${menuOpen ? "menu-is-open" : ""}`}
        ref={stage}
        inert={menuPresent}
      >
        <div className="page-surface">
          <header className="site-header gutter" ref={header}>
            <a
              href="/"
              className="logo"
              aria-label="Codelab — acasă"
              onClick={pathname === "/" ? backToTop : undefined}
            >
              code<span>lab</span>
            </a>
            <nav className="header-nav" aria-label="Navigare principală">
              {navigation
                .filter((item) =>
                  ["/proiecte", "/servicii", "/studio"].includes(item.href),
                )
                .map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    aria-current={
                      pathname === item.href
                        ? "page"
                        : pathname.startsWith(item.href + "/")
                          ? "location"
                          : undefined
                    }
                  >
                    {item.label}
                  </a>
                ))}
            </nav>
          </header>
          {children}
          <SiteFooter
            pathname={pathname}
            navigation={navigation}
            onBackToTop={backToTop}
          />
        </div>
        <div className="stage-shade" aria-hidden="true" />
      </div>
    </>
  );
}
