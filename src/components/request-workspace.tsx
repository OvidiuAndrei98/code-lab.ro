"use client";

import {
  useEffect,
  useLayoutEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import { Arrow } from "./icons";
import {
  demoRequests,
  demoSlots,
  getRequestCounts,
  getSlotState,
  initialRequestState,
  requestReducer,
  type RequestAction,
} from "@/lib/request-demo";

export function RequestWorkspace() {
  const [state, dispatch] = useReducer(requestReducer, initialRequestState);
  const [mobileView, setMobileView] = useState<"list" | "detail">("list");
  const root = useRef<HTMLElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const resetButton = useRef<HTMLButtonElement>(null);
  const previousPositions = useRef<Map<
    string,
    { x: number; y: number }
  > | null>(null);
  const animations = useRef(new Set<Animation>());
  const focusAfter = useRef<"detail" | "list" | "slot" | "reset" | null>(null);
  const counts = getRequestCounts(state);
  const selected = demoRequests.find((item) => item.id === state.selectedId)!;
  const booking = state.bookings[selected.id];
  const previousBookings = useRef(state.bookings);
  useEffect(() => {
    const before = previousBookings.current;
    previousBookings.current = state.bookings;
    if (
      before === state.bookings ||
      matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const changedIds = demoRequests
      .filter((request) => before[request.id] !== state.bookings[request.id])
      .map((request) => request.id);
    const changedSlots = new Set(
      changedIds
        .flatMap((id) => [before[id], state.bookings[id]])
        .filter((slot): slot is string => Boolean(slot)),
    );
    const selectors = [
      "[data-pending-count]",
      "[data-scheduled-count]",
      ...changedIds.map((id) => `[data-request-id="${id}"] .app-row-status`),
    ];
    if (changedIds.some((id) => id === state.selectedId))
      selectors.push(".app-request-result strong");
    const targets = [
      ...(root.current?.querySelectorAll<HTMLElement>(selectors.join(",")) ||
        []),
    ];
    root.current
      ?.querySelectorAll<HTMLInputElement>(".app-slot input")
      .forEach((input) => {
        if (changedSlots.has(input.value) && input.nextElementSibling)
          targets.push(input.nextElementSibling as HTMLElement);
      });
    const local = targets.map((element) =>
      element.animate([{ opacity: 0.45 }, { opacity: 1 }], {
        duration: 220,
        easing: "ease-out",
      }),
    );
    const stop = () => local.forEach((animation) => animation.cancel());
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    preference.addEventListener("change", stop);
    return () => {
      stop();
      preference.removeEventListener("change", stop);
    };
  }, [state.bookings]);

  const captureRows = () => {
    const positions = new Map<string, { x: number; y: number }>();
    root.current
      ?.querySelectorAll<HTMLElement>("[data-request-id]")
      .forEach((row) => {
        if (!row.getClientRects().length) return;
        const rect = row.getBoundingClientRect();
        positions.set(row.dataset.requestId!, {
          x: rect.left + scrollX,
          y: rect.top + scrollY,
        });
      });
    previousPositions.current = positions;
    animations.current.forEach((animation) => animation.cancel());
    animations.current.clear();
  };
  const commit = (action: RequestAction) => {
    captureRows();
    focusAfter.current =
      action.type === "reset"
        ? "reset"
        : action.type === "schedule" && !state.selectedSlotId
          ? "slot"
          : mobileView === "list" && matchMedia("(max-width: 900px)").matches
            ? "list"
            : "detail";
    if (action.type === "reset") setMobileView("list");
    dispatch(action);
  };
  useLayoutEffect(() => {
    const positions = previousPositions.current;
    previousPositions.current = null;
    if (positions && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const ease = getComputedStyle(document.documentElement)
        .getPropertyValue("--ease-out")
        .trim();
      const moves = [
        ...(root.current?.querySelectorAll<HTMLElement>("[data-request-id]") ||
          []),
      ]
        .filter((row) => row.getClientRects().length)
        .map((row) => {
          const before = positions.get(row.dataset.requestId!);
          const after = row.getBoundingClientRect();
          return {
            row,
            x: before ? before.x - after.left - scrollX : 0,
            y: before ? before.y - after.top - scrollY : 0,
          };
        });
      moves.forEach(({ row, x, y }) => {
        if (Math.abs(x) + Math.abs(y) < 1) return;
        const animation = row.animate(
          [
            { transform: `translate(${x}px, ${y}px)` },
            { transform: "translate(0, 0)" },
          ],
          { duration: 280, easing: ease },
        );
        animations.current.add(animation);
        animation.finished
          .then(() => animations.current.delete(animation))
          .catch(() => {});
      });
    }
    const target = focusAfter.current;
    focusAfter.current = null;
    if (target === "detail") title.current?.focus({ preventScroll: true });
    if (target === "list")
      root.current
        ?.querySelector<HTMLElement>(`[data-request-id="${state.selectedId}"]`)
        ?.focus({ preventScroll: true });
    if (target === "slot")
      root.current
        ?.querySelector<HTMLInputElement>(".app-slot input:not(:disabled)")
        ?.focus({ preventScroll: true });
    if (target === "reset") resetButton.current?.focus({ preventScroll: true });
  }, [state, mobileView]);
  useEffect(() => {
    const active = animations.current;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const stop = () => {
      if (reduced.matches) {
        active.forEach((animation) => animation.cancel());
        active.clear();
      }
    };
    reduced.addEventListener("change", stop);
    return () => {
      reduced.removeEventListener("change", stop);
      active.forEach((animation) => animation.cancel());
      active.clear();
    };
  }, []);

  return (
    <section
      className="app-demo gutter"
      ref={root}
      aria-labelledby="app-demo-title"
    >
      <div className="app-demo-label">
        <h2 id="app-demo-title">Demonstrație interactivă · date de exemplu</h2>
        <span>Gestionarea solicitărilor</span>
      </div>
      <p className="app-demo-instruction">
        Alege o solicitare, selectează un interval și confirmă programarea.
      </p>
      <div className="app-workspace">
        <header className="app-workspace-header">
          <div>
            <h3>Solicitări</h3>
            <p>
              <span data-pending-count>{counts.pending}</span> de programat{" "}
              <span aria-hidden="true">/</span>{" "}
              <span data-scheduled-count>{counts.scheduled}</span> programate
            </p>
          </div>
          <div className="app-workspace-tools">
            <button
              type="button"
              className="app-undo"
              disabled={!state.history.length}
              onClick={() => commit({ type: "undo" })}
            >
              Anulează ultima acțiune <span aria-hidden="true">↶</span>
            </button>
            <button
              type="button"
              className="app-reset"
              ref={resetButton}
              onClick={() => commit({ type: "reset" })}
            >
              Resetează <span aria-hidden="true">↺</span>
            </button>
          </div>
        </header>
        <div className="app-workspace-body" data-mobile-view={mobileView}>
          <div className="app-request-list">
            {([false, true] as const).map((scheduled) => {
              const requests = demoRequests.filter(
                (request) => Boolean(state.bookings[request.id]) === scheduled,
              );
              return (
                <section
                  className="app-request-group"
                  key={String(scheduled)}
                  aria-labelledby={
                    scheduled ? "app-scheduled-title" : "app-pending-title"
                  }
                >
                  <h4
                    id={scheduled ? "app-scheduled-title" : "app-pending-title"}
                  >
                    {scheduled ? "Programate" : "De programat"}
                    <span>{requests.length}</span>
                  </h4>
                  <ul>
                    {requests.map((request) => (
                      <li key={request.id}>
                        <button
                          type="button"
                          className="app-request-row"
                          data-request-id={request.id}
                          aria-pressed={state.selectedId === request.id}
                          aria-controls="app-request-detail"
                          onClick={() => {
                            if (matchMedia("(max-width: 900px)").matches)
                              focusAfter.current = "detail";
                            setMobileView("detail");
                            dispatch({
                              type: "select-request",
                              id: request.id,
                            });
                          }}
                        >
                          <span className="app-row-title">{request.title}</span>
                          <span className="app-row-status">
                            {state.bookings[request.id]
                              ? `Programată · ${state.bookings[request.id]}`
                              : "De programat"}
                          </span>
                          <Arrow />
                        </button>
                      </li>
                    ))}
                  </ul>
                  {!requests.length && (
                    <p className="app-list-empty">
                      {scheduled
                        ? "Nicio solicitare programată."
                        : "Toate solicitările sunt programate."}
                    </p>
                  )}
                </section>
              );
            })}
          </div>
          <section
            id="app-request-detail"
            className="app-request-detail"
            aria-labelledby="app-selected-title"
          >
            <button
              type="button"
              className="app-mobile-back"
              onClick={() => {
                focusAfter.current = "list";
                setMobileView("list");
              }}
            >
              ← Înapoi la solicitări
            </button>
            <div className="app-detail-content" key={selected.id}>
              <span className="app-detail-label">Solicitarea selectată</span>
              <h4 id="app-selected-title" ref={title} tabIndex={-1}>
                {selected.title}
              </h4>
              <p>{selected.description}</p>
              <dl className="app-detail-facts">
                <div>
                  <dt>Tip</dt>
                  <dd>{selected.category}</dd>
                </div>
                <div>
                  <dt>Durată</dt>
                  <dd>{selected.duration}</dd>
                </div>
              </dl>
            </div>
            <div
              className="app-request-result"
              data-scheduled={Boolean(booking)}
            >
              <span>Starea solicitării</span>
              <strong>{booking ? "Programată" : "De programat"}</strong>
              <p>
                {booking
                  ? `Interval rezervat: ${booking}.`
                  : "Niciun interval rezervat."}
              </p>
            </div>
          </section>
          <section
            className="app-request-action"
            aria-labelledby="app-action-title"
          >
            {booking ? (
              <div className="app-booked-state">
                <span className="app-detail-label">Programare confirmată</span>
                <h4 id="app-action-title">{booking}</h4>
                <p>
                  Intervalul aparține acestei solicitări și nu mai poate fi ales
                  pentru alta.
                </p>
                <button
                  type="button"
                  className="app-cancel"
                  onClick={() => commit({ type: "cancel" })}
                >
                  Anulează programarea <span aria-hidden="true">↶</span>
                </button>
                <span className="app-booked-hint">
                  Anularea eliberează intervalul.
                </span>
              </div>
            ) : (
              <form
                noValidate
                onSubmit={(event) => {
                  event.preventDefault();
                  commit({ type: "schedule" });
                }}
              >
                <fieldset className="app-slot-options">
                  <legend id="app-action-title">Alege un interval</legend>
                  <p id="app-slot-help">
                    Aceeași zi demonstrativă. Intervalele ocupate nu pot fi
                    selectate.
                  </p>
                  <div className="app-slot-grid">
                    {demoSlots.map((slot) => {
                      const available =
                        getSlotState(state, slot.id) === "available";
                      return (
                        <label
                          className="app-slot"
                          data-available={available}
                          key={slot.id}
                        >
                          <input
                            type="radio"
                            name="request-slot"
                            value={slot.id}
                            checked={state.selectedSlotId === slot.id}
                            disabled={!available}
                            aria-describedby={
                              state.error ? "app-slot-error" : "app-slot-help"
                            }
                            aria-invalid={Boolean(state.error)}
                            onChange={() =>
                              dispatch({ type: "select-slot", id: slot.id })
                            }
                          />
                          <span>
                            <strong>{slot.label}</strong>
                            <small>
                              {available
                                ? "Disponibil"
                                : slot.initiallyOccupied
                                  ? "Ocupat inițial"
                                  : "Ocupat"}
                            </small>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
                <p
                  className="app-slot-feedback"
                  id="app-slot-error"
                  role={state.error ? "alert" : undefined}
                  data-error={Boolean(state.error)}
                >
                  {state.error ||
                    (state.selectedSlotId
                      ? `${state.selectedSlotId} este ales. Poți confirma programarea.`
                      : "Alege un interval disponibil, apoi confirmă.")}
                </p>
                <button type="submit" className="app-confirm">
                  Confirmă programarea <Arrow />
                </button>
              </form>
            )}
          </section>
        </div>
        <div className="app-workspace-feedback">
          <p role="status" aria-live="polite" aria-atomic="true">
            {state.message}
          </p>
          <span>Demo local. Fără programări reale.</span>
        </div>
      </div>
      <p className="app-demo-explanation">
        Încearcă o programare, apoi selectează altă solicitare: intervalul
        rezervat devine indisponibil. „Anulează ultima acțiune” reface
        solicitarea și disponibilitatea.
      </p>
    </section>
  );
}
