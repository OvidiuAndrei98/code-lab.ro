"use client";

import Image from "next/image";
import { useEffect, useRef, type CSSProperties } from "react";
import type { ProjectMediaSource } from "@/lib/projects";

export function ProjectMedia({
  media,
  title,
}: {
  media: ProjectMediaSource;
  title: string;
}) {
  const preview = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = preview.current;
    if (!element || media.type !== "html") return;
    // CSS container units handle the first paint; retain a fallback for older browsers.
    if (CSS.supports("transform", "scale(calc(1px / 1px))")) return;
    const fit = () =>
      element.style.setProperty(
        "--fason-preview-scale",
        String(element.clientWidth / media.width),
      );
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(element);
    return () => observer.disconnect();
  }, [media.type, media.width]);

  return (
    <div
      className="showcase-media project-media"
      ref={preview}
      aria-hidden="true"
      style={
        {
          aspectRatio: `${media.width} / ${media.height}`,
          "--project-native-width": `${media.width}px`,
        } as CSSProperties
      }
    >
      {media.type === "html" ? (
        <iframe
          src={media.src}
          title={`${title} — previzualizare desktop`}
          width={media.width}
          height={media.height}
          style={{ width: media.width, height: media.height }}
          tabIndex={-1}
          sandbox="allow-same-origin"
          loading="eager"
        />
      ) : (
        <Image
          className="project-preview-image"
          src={media.src}
          alt={media.alt}
          width={media.width}
          height={media.height}
          sizes="(max-width: 800px) 100vw, 80vw"
        />
      )}
    </div>
  );
}
