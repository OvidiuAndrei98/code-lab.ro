import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// One document-scroll progress owns contact, compression and covering.
export function setupHomeHandoff(root: HTMLElement | null) {
  const opening = root?.querySelector<HTMLElement>(".home-opening");
  const hero = opening?.querySelector<HTMLElement>(
    ".identity-section:not(.hydraulic-hero)",
  );
  const panel = opening?.querySelector<HTMLElement>(".showcase-section");
  const word = hero?.querySelector<HTMLElement>(".identity-lockup");
  if (!opening || !hero || !panel || !word) return;
  const sticky = () => getComputedStyle(hero).position === "sticky";
  let inkHeight = 1,
    inkOffset = 0,
    origin = 0,
    approachGap = 1;
  const setScale = gsap.quickSetter(word, "scaleY");
  const measure = () => {
    gsap.set(word, { scaleY: 1 });
    const heroBox = hero.getBoundingClientRect();
    const bounds = [...word.querySelectorAll<SVGSVGElement>("svg")].map(
      (svg) => {
        const rect = svg.getBoundingClientRect();
        // Measure the full ink without interrupting its first-paint entrance.
        const matrix = new DOMMatrix(
          getComputedStyle(svg.closest(".identity-fill")!).transform,
        );
        const height = rect.height / (Math.abs(matrix.d) || 1);
        return { top: rect.bottom - height, bottom: rect.bottom };
      },
    );
    const top = Math.min(...bounds.map((b) => b.top));
    inkHeight = Math.max(...bounds.map((b) => b.bottom)) - top;
    inkOffset = top - heroBox.top;
    gsap.set(word, {
      transformOrigin: `50% ${top - word.getBoundingClientRect().top}px`,
    });
    origin = panel.getBoundingClientRect().top + scrollY;
    const openingOrigin = opening.getBoundingClientRect().top + scrollY;
    approachGap = Math.max(1, origin - openingOrigin - inkOffset - inkHeight);
  };
  measure();
  const render = (trigger: ScrollTrigger) => {
    if (!sticky()) {
      setScale(1);
      panel.style.setProperty("--home-handoff-round", "1");
      return;
    }
    const panelTop = origin - trigger.scroll();
    const anchor = hero.getBoundingClientRect().top + inkOffset;
    const space = panelTop - anchor;
    const minimum = innerWidth < 700 ? 0.32 : 0.25;
    const scale = gsap.utils.clamp(minimum, 1, space / inkHeight);
    setScale(scale);
    panel.style.setProperty(
      "--home-handoff-round",
      String(gsap.utils.clamp(0, 1, (space - inkHeight) / approachGap)),
    );
    hero.dataset.pressPhase =
      scale === 1 ? "approach" : scale > minimum ? "press" : "cover";
  };
  const trigger = ScrollTrigger.create({
    id: "home-handoff",
    trigger: panel,
    start: "top bottom",
    end: "top top",
    scrub: true,
    invalidateOnRefresh: true,
    onRefreshInit: measure,
    onRefresh: render,
    onUpdate: render,
  });
  render(trigger);
  return () => {
    trigger.kill();
    gsap.set(word, { clearProps: "transform,transformOrigin" });
    panel.style.removeProperty("--home-handoff-round");
    delete hero.dataset.pressPhase;
  };
}
