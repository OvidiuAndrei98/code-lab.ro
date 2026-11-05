// Self-contained so the server can inline the same probe before first paint.
// This only chooses native CSS styling; it never handles scroll input/position.
export function syncNativeScrollbar() {
  const root = document.documentElement;
  root.removeAttribute("data-classic-scrollbar");
  root.style.removeProperty("--native-scrollbar-size");
  if (
    !matchMedia("(hover: hover) and (pointer: fine) and (forced-colors: none)")
      .matches
  )
    return;
  const gutter = innerWidth - root.getBoundingClientRect().width;
  if (gutter < 1) return;
  root.style.setProperty("--native-scrollbar-size", `${gutter}px`);
  root.setAttribute("data-classic-scrollbar", "");
}
