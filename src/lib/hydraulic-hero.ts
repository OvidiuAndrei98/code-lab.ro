import gsap from "gsap";

// Called inside useGSAP, before downstream ScrollTriggers are measured.
export function setupHydraulicHero(root: HTMLElement | null) {
  const hero = root?.querySelector<HTMLElement>(".hydraulic-hero");
  if (!hero) return;
  const media = gsap.matchMedia();
  media.add("(min-height: 600px)", () => {
    const lockup = hero.querySelector<HTMLElement>(".identity-lockup")!;
    const glyphs = gsap.utils.toArray<HTMLElement>(
      hero.querySelectorAll(".identity-stretch"),
    );
    const machine = hero.querySelector<HTMLElement>(".hydraulic-machine")!;
    const head = hero.querySelector<HTMLElement>(".hydraulic-head")!;
    const bed = hero.querySelector<HTMLElement>(".hydraulic-bed")!;
    const topLabels = hero.querySelectorAll<HTMLElement>(
      ".identity-top > span",
    );
    const originalStyles = [...glyphs, machine, head, bed, ...topLabels].map(
      (element) => ({ element, style: element.getAttribute("style") }),
    );
    const compression = 0.22;
    // Use layout coordinates, so resize/refresh cannot measure animated bounds.
    const baseline = () => lockup.offsetTop + lockup.offsetHeight;
    const contact = () => lockup.offsetTop - head.offsetHeight;
    const pressed = () =>
      baseline() - lockup.offsetHeight * compression - head.offsetHeight;

    gsap.set(machine, { autoAlpha: 0 });
    gsap.set(head, { y: -head.offsetHeight - 12 });
    gsap.set(bed, { y: baseline });

    const sequence = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        id: "hydraulic-hero",
        trigger: hero,
        start: "top top",
        end: () => `+=${Math.round(innerHeight * 0.95)}`,
        pin: true,
        // The menu translates the ancestor stage, including this pinned surface.
        pinType: "transform",
        scrub: 0.22,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onRefresh: () => gsap.set(bed, { y: baseline() }),
      },
    });
    sequence
      .to(topLabels, { opacity: 0, duration: 0.1 }, 0)
      .to(machine, { autoAlpha: 1, duration: 0.08 }, 0.04)
      .to(head, { y: contact, duration: 0.3 }, 0)
      .addLabel("contact", 0.3)
      .to(head, { y: pressed, duration: 0.52 }, "contact")
      .to(glyphs, { scaleY: compression, duration: 0.52 }, "contact")
      .to({}, { duration: 0.18 });
    return () => {
      // ScrollTrigger refresh may leave an identity matrix after reverting a pin.
      // Restore exactly these owned layers when switching to the static layout.
      originalStyles.forEach(({ element, style }) => {
        if (style === null) element.removeAttribute("style");
        else element.setAttribute("style", style);
      });
    };
  });
  return () => media.revert();
}
