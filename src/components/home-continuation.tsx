"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Arrow } from "./icons";
import { HomeServices } from "./home-services";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export function HomeContinuation() {
  const root = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      const media = gsap.matchMedia();
      media.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(".home-contact-line > span", {
          yPercent: 105,
          duration: 0.85,
          stagger: 0.07,
          ease: "power4.out",
          scrollTrigger: {
            trigger: ".home-contact",
            start: "top 88%",
            once: true,
          },
          clearProps: "transform",
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
    <div className="home-continuation" ref={root}>
      <HomeServices />
      <section
        className="home-studio-pause gutter"
        aria-labelledby="home-studio-title"
      >
        <h2 id="home-studio-title">
          Despre CODELAB
          <br />
          <span>București, România</span>
        </h2>
        <div>
          <p className="home-studio-lead">
            Suntem o agenție de web design și dezvoltare. Lucrezi direct cu
            oamenii care îți fac site-ul.
          </p>
          <div className="home-studio-foot">
            <p>
              Ne ocupăm împreună de design și dezvoltare, de la prima discuție
              până la lansare.
            </p>
            <a href="/studio" className="quiet-link">
              Cunoaște CODELAB <Arrow diagonal />
            </a>
          </div>
        </div>
      </section>
      <section
        className="home-contact gutter"
        aria-labelledby="home-contact-title"
      >
        <div className="home-contact-top">
          <span>Următorul proiect</span>
          <span>CODELAB / București</span>
        </div>
        <a href="/contact" className="home-contact-link">
          <h2 id="home-contact-title">
            <span className="home-contact-line">
              <span>Vorbim despre</span>
            </span>
            <span className="home-contact-line">
              <span>proiectul tău.</span>
            </span>
          </h2>
          <span className="home-contact-direction" aria-hidden="true">
            <svg viewBox="0 0 100 100" fill="none" aria-hidden="true">
              <path
                d="M0 100 100 0M0 0h100v100"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          </span>
          <span className="home-contact-action">
            Pregătește un brief <Arrow diagonal />
          </span>
        </a>
      </section>
    </div>
  );
}
