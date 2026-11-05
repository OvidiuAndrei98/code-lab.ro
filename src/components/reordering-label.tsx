"use client";

import { useEffect, useRef } from "react";
import styles from "./reordering-label.module.css";

export function ReorderingLabel({ label }: { label: string }) {
  const surfaceRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const surface = surfaceRef.current;
    const link = surface?.closest("a");
    const text = surface?.querySelector<HTMLElement>(
      "[data-footer-label-text]",
    );
    const characters = [
      ...(surface?.querySelectorAll<HTMLElement>("[data-footer-character]") ??
        []),
    ];
    if (!link || !surface || !text || characters.length < 2) return;

    const motion = matchMedia(
      "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
    );
    let animations: Animation[] = [];
    let generation = 0;
    let naturalPositions: number[] = [];

    const cancel = () => {
      animations.forEach((animation) => animation.cancel());
      animations = [];
    };
    const reset = () => {
      generation++;
      cancel();
      surface.removeAttribute("data-reordering");
    };
    const finish = (animation: Animation, version: number) => {
      animation.finished
        .then(() => {
          if (version === generation) reset();
        })
        .catch(() => {
          // Pointer exit, resize and reduced motion can cancel the sequence.
        });
    };

    const enter = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || !motion.matches) return;
      reset();
      const node = text.firstChild;
      if (!node || node.nodeType !== Node.TEXT_NODE) return;

      // Measure the real, kerned label once. Transforms then reorder its glyphs
      // inside the same width; no text or layout changes during the animation.
      const bounds = text.getBoundingClientRect();
      const range = document.createRange();
      naturalPositions = characters.map((_, index) => {
        range.setStart(node, index);
        range.setEnd(node, index + 1);
        return range.getBoundingClientRect().left - bounds.left;
      });
      const advances = naturalPositions.map(
        (x, index) => (naturalPositions[index + 1] ?? bounds.width) - x,
      );
      const order = characters.map((_, index) => index).reverse();
      const positions = () => {
        let x = 0;
        const result: number[] = [];
        order.forEach((index) => {
          result[index] = x;
          x += advances[index];
        });
        return result;
      };
      const duration = 40 + (characters.length - 1) * 30;
      const ease = getComputedStyle(link).getPropertyValue("--ease-out").trim();
      const reversed = positions();
      const frames: Keyframe[][] = characters.map((_, index) => [
        { transform: `translateX(${reversed[index]}px)`, offset: 0 },
        {
          transform: `translateX(${reversed[index]}px)`,
          offset: 40 / duration,
          easing: ease,
        },
      ]);

      // Move the last character of the reversed word into the next available
      // place at the start, then repeat until the original word is restored.
      for (let index = 0; index < characters.length - 1; index++) {
        order.splice(order.indexOf(index), 1);
        order.splice(index, 0, index);
        const next = positions();
        characters.forEach((_, character) => {
          frames[character].push({
            transform: `translateX(${next[character]}px)`,
            offset: (40 + (index + 1) * 30) / duration,
            easing: ease,
          });
        });
      }

      const version = generation;
      animations = characters.map((character, index) =>
        character.animate(frames[index], { duration, fill: "both" }),
      );
      surface.setAttribute("data-reordering", "");
      finish(animations.at(-1)!, version);
    };

    const leave = () => {
      if (!surface.hasAttribute("data-reordering")) return;
      const transforms = characters.map(
        (character) => getComputedStyle(character).transform,
      );
      const version = ++generation;
      cancel();
      const ease = getComputedStyle(link).getPropertyValue("--ease-out").trim();
      animations = characters.map((character, index) =>
        character.animate(
          [
            { transform: transforms[index] },
            { transform: `translateX(${naturalPositions[index]}px)` },
          ],
          { duration: 90, easing: ease, fill: "both" },
        ),
      );
      finish(animations.at(-1)!, version);
    };

    const size = new ResizeObserver(reset);
    size.observe(text);
    motion.addEventListener("change", reset);
    link.addEventListener("pointerenter", enter);
    link.addEventListener("pointerleave", leave);
    link.addEventListener("focus", reset);
    link.addEventListener("blur", reset);
    return () => {
      size.disconnect();
      motion.removeEventListener("change", reset);
      link.removeEventListener("pointerenter", enter);
      link.removeEventListener("pointerleave", leave);
      link.removeEventListener("focus", reset);
      link.removeEventListener("blur", reset);
      reset();
    };
  }, [label]);

  return (
    <span className={styles.label} data-footer-label ref={surfaceRef}>
      <span className={styles.labelText} data-footer-label-text>
        {label}
      </span>
      <span className={styles.letters} aria-hidden="true" data-footer-letters>
        {[...label].map((character, index) => (
          <span
            className={styles.character}
            data-footer-character={index}
            key={index}
          >
            {character}
          </span>
        ))}
      </span>
    </span>
  );
}
