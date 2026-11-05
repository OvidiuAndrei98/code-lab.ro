"use client";

import { useEffect, useRef, useState } from "react";
import { Arrow } from "./icons";

const services = [
  { id: "website", label: "Website-uri" },
  { id: "ecommerce", label: "E-commerce" },
  { id: "aplicatii", label: "Aplicații web" },
];

export function ServiceRail() {
  const [active, setActive] = useState("website");
  const nav = useRef<HTMLElement>(null);
  useEffect(() => {
    const sections = services
      .map(({ id }) => document.getElementById(id))
      .filter((element): element is HTMLElement => !!element);
    const observer = new IntersectionObserver(
      () => {
        const closest = sections.reduce((best, section) => {
          const top = section.getBoundingClientRect().top;
          return top <= innerHeight * 0.45 ? section.id : best;
        }, "website");
        setActive(closest);
      },
      { rootMargin: "-15% 0px -45% 0px", threshold: 0 },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);
  return (
    <nav
      className="service-rail gutter"
      ref={nav}
      aria-label="Alege un serviciu"
    >
      {services.map(({ id, label }) => (
        <a
          key={id}
          href={`#${id}`}
          onClick={() => setActive(id)}
          aria-current={active === id ? "location" : undefined}
        >
          {label}
          <Arrow />
        </a>
      ))}
    </nav>
  );
}
