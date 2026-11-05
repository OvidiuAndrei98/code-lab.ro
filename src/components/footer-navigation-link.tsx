"use client";

import { ReorderingLabel } from "./reordering-label";

type FooterNavigationLinkProps = {
  href: string;
  label: string;
  current?: "page" | "location";
};

export function FooterNavigationLink({
  href,
  label,
  current,
}: FooterNavigationLinkProps) {
  return (
    <a href={href} aria-current={current}>
      <ReorderingLabel label={label} />
    </a>
  );
}
