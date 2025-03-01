"use client";
import "./AnimatedSlider.css";
import Showcase1 from "../../public/showcase1.png";
import Showcase2 from "../../public/showcase2.png";
import Showcase3 from "../../public/showcase3.png";
import Showcase4 from "../../public/showcase4.png";
import Image from "next/image";

import { useEffect } from "react";

const AnimatedSlider = () => {
  useEffect(() => {
    const scrollers = document.querySelectorAll(".scroller");

    // If a user hasn't opted in for recuded motion, then we add the animation
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      addAnimation();
    }

    function addAnimation() {
      scrollers.forEach((scroller) => {
        // add data-animated="true" to every `.scroller` on the page
        scroller.setAttribute("data-animated", "true");

        // Make an array from the elements within `.scroller-inner`
        const scrollerInner = scroller.querySelector(".scroller__inner");
        if (scrollerInner === null) return;
        const scrollerContent = Array.from(scrollerInner.children);

        // For each item in the array, clone it
        // add aria-hidden to it
        // add it into the `.scroller-inner`
        scrollerContent.forEach((item) => {
          const duplicatedItem = item.cloneNode(true);
          (duplicatedItem as HTMLElement).setAttribute("aria-hidden", "true");
          scrollerInner.appendChild(duplicatedItem);
        });
      });
    }
  }, []);

  return (
    <div className="scroller h-[260px] w-full static" data-speed="fast">
      <ul className="tag-list scroller__inner">
        <li className="w-[300px] md:w-[400px] rounded-xl">
          <Image
            src={Showcase1}
            alt="showcase1"
            className="h-[190px] md:h-[250px] rounded-xl"
          />
        </li>
        <li className="w-[300px] md:w-[400px] rounded-xl">
          <Image
            src={Showcase2}
            alt="showcase1"
            className="h-[190px] md:h-[250px] rounded-xl"
          />
        </li>
        <li className="w-[300px] md:w-[400px] rounded-xl">
          <Image
            src={Showcase4}
            alt="showcase1"
            className="h-[190px] md:h-[250px] rounded-lg"
          />
        </li>
        <li className="w-[300px] md:w-[400px] rounded-xl">
          <Image
            src={Showcase3}
            alt="showcase1"
            className="h-[190px] md:h-[250px] rounded-xl"
          />
        </li>
      </ul>
    </div>
  );
};

export default AnimatedSlider;
