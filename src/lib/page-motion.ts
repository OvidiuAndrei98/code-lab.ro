// Runs in the head before a cross-document transition is revealed.
export function installPageMotion() {
  type Transition = { skipTransition(): void; finished: Promise<void> };
  let active: Transition | null = null;
  const remember = (event: Event) => {
    const transition = (event as Event & { viewTransition?: Transition })
      .viewTransition;
    active = transition ?? null;
    if (transition) {
      const clear = () => {
        if (active === transition) active = null;
      };
      transition.finished.then(clear, clear);
    }
  };
  addEventListener("pagereveal", remember);
  addEventListener("pageswap", remember);
  document.addEventListener(
    "click",
    (event) => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target?.closest(".menu-tab, a[href]")) return;
      // A new action takes over from the static navigation snapshot immediately.
      const transition =
        (document as Document & { activeViewTransition?: Transition })
          .activeViewTransition ?? active;
      transition?.skipTransition();
    },
    true,
  );
}
