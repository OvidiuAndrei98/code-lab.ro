"use client";

import { useEffect, useReducer, useRef } from "react";
import Image from "next/image";
import { Arrow } from "./icons";

const formats = {
  A5: { dimensions: "148 × 210 mm", price: 60 },
  A4: { dimensions: "210 × 297 mm", price: 90 },
};
type Format = keyof typeof formats;
type State = {
  format: Format;
  quantity: number;
  cart: Record<Format, number>;
  open: boolean;
  message: string;
  cartMessage: string;
};
type Action =
  | { type: "format"; value: Format }
  | { type: "quantity"; delta: number }
  | { type: "add" }
  | { type: "toggle" }
  | { type: "remove"; format: Format }
  | { type: "reset" };
const initial: State = {
  format: "A5",
  quantity: 1,
  cart: { A5: 0, A4: 0 },
  open: false,
  message: "",
  cartMessage: "",
};
function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "format":
      return {
        ...state,
        format: action.value,
        message: `Format ${action.value} selectat. ${state.quantity * formats[action.value].price} lei pentru selecția curentă.`,
      };
    case "quantity":
      return {
        ...state,
        quantity: Math.max(1, Math.min(20, state.quantity + action.delta)),
        message: `Cantitate: ${Math.max(1, Math.min(20, state.quantity + action.delta))}. Total selecție: ${Math.max(1, Math.min(20, state.quantity + action.delta)) * formats[state.format].price} lei.`,
      };
    case "toggle":
      return { ...state, open: !state.open };
    case "reset":
      return {
        ...initial,
        message: "Demonstrația a fost resetată. Coșul este gol.",
      };
    case "remove":
      return {
        ...state,
        cart: { ...state.cart, [action.format]: 0 },
        message: `Carnetul ${action.format} a fost eliminat din coș.`,
        cartMessage: `Carnetul ${action.format} a fost eliminat din coș.`,
      };
    case "add": {
      const cart = {
        ...state.cart,
        [state.format]: state.cart[state.format] + state.quantity,
      };
      const count = cart.A5 + cart.A4;
      return {
        ...state,
        cart,
        open: true,
        message: `${state.quantity} ${state.quantity === 1 ? "carnet" : "carnete"} ${state.format} ${state.quantity === 1 ? "adăugat" : "adăugate"}. În coș: ${count} ${count === 1 ? "carnet" : "carnete"}.`,
        cartMessage: `${state.quantity} ${state.quantity === 1 ? "carnet" : "carnete"} ${state.format} ${state.quantity === 1 ? "adăugat" : "adăugate"} în coș.`,
      };
    }
  }
}

export function ShopDemonstration() {
  const [state, dispatch] = useReducer(reducer, initial);
  const add = useRef<HTMLButtonElement>(null);
  const cartToggle = useRef<HTMLButtonElement>(null);
  const root = useRef<HTMLElement>(null);
  const previous = useRef(state);
  useEffect(() => {
    const before = previous.current;
    previous.current = state;
    if (
      before === state ||
      matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const selectors = new Set<string>();
    if (before.format !== state.format) selectors.add(".shop-selection-price");
    if (before.format !== state.format || before.quantity !== state.quantity)
      selectors.add(".shop-selection-total");
    if (before.cart !== state.cart) {
      selectors.add(".shop-cart-toggle > span");
      selectors.add(".shop-cart-total strong");
      selectors.add(".shop-cart-item");
    }
    const animations = [...selectors]
      .flatMap((selector) => [
        ...(root.current?.querySelectorAll(selector) || []),
      ])
      .map((element) =>
        element.animate(
          [
            { opacity: 0.55, transform: "translateY(3px)" },
            { opacity: 1, transform: "none" },
          ],
          { duration: 220, easing: "cubic-bezier(0.23, 1, 0.32, 1)" },
        ),
      );
    const stop = () => animations.forEach((animation) => animation.cancel());
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    preference.addEventListener("change", stop);
    return () => {
      stop();
      preference.removeEventListener("change", stop);
    };
  }, [state]);
  const totalCount = state.cart.A5 + state.cart.A4;
  const total =
    state.cart.A5 * formats.A5.price + state.cart.A4 * formats.A4.price;
  const selected = formats[state.format];
  const reset = () => {
    dispatch({ type: "reset" });
    add.current?.focus({ preventScroll: true });
  };
  return (
    <section
      className="shop-demonstration gutter"
      ref={root}
      aria-labelledby="shop-demo-title"
    >
      <div className="shop-demo-heading">
        <h2 id="shop-demo-title">Demonstrație interactivă</h2>
        <span>
          Schimbă formatul și cantitatea, apoi încearcă adăugarea în coș.
        </span>
      </div>
      <div className="shop-product-stage">
        <figure className="shop-product-visual">
          <Image
            src="/images/shop/sketchbook.webp"
            alt="Carnet demonstrativ deschis, cu pagini albe, copertă neagră și semn de carte portocaliu"
            width={1536}
            height={1024}
            sizes="(max-width: 800px) 100vw, 66vw"
            preload
          />
          <figcaption>
            <span>Carnet de idei</span>
            <span>Papetărie / concept demonstrativ</span>
          </figcaption>
        </figure>
        <div className="shop-product-details">
          <div className="shop-product-topline">
            <span>Produs demonstrativ</span>
            <span>Hârtie & idei</span>
          </div>
          <h3>
            Carnet
            <br />
            de idei.
          </h3>
          <p className="shop-product-description">
            Pagini albe. Copertă textilă. Loc pentru ce urmează.
          </p>
          <div className="shop-selection-price">
            <span>
              {state.format} · {selected.dimensions}
            </span>
            <strong>
              {selected.price} <small>lei / buc.</small>
            </strong>
          </div>
          <fieldset className="shop-format-options">
            <legend>Format</legend>
            {(Object.keys(formats) as Format[]).map((format) => (
              <label key={format}>
                <input
                  type="radio"
                  name="shop-format"
                  value={format}
                  checked={state.format === format}
                  onChange={() => dispatch({ type: "format", value: format })}
                />
                <span>
                  <strong>{format}</strong>
                  <small>{formats[format].dimensions}</small>
                </span>
              </label>
            ))}
          </fieldset>
          <div className="shop-order-row">
            <div
              className="shop-quantity-control"
              role="group"
              aria-label="Cantitate"
            >
              <button
                type="button"
                aria-label="Scade cantitatea"
                disabled={state.quantity === 1}
                onClick={() => dispatch({ type: "quantity", delta: -1 })}
              >
                −
              </button>
              <output aria-label="Cantitatea selectată">
                {state.quantity}
              </output>
              <button
                type="button"
                aria-label="Crește cantitatea"
                disabled={state.quantity === 20}
                onClick={() => dispatch({ type: "quantity", delta: 1 })}
              >
                +
              </button>
            </div>
            <span className="shop-selection-total">
              {state.quantity * selected.price} lei <small>selecția ta</small>
            </span>
          </div>
          <button
            className="shop-add-button"
            type="button"
            ref={add}
            onClick={() => dispatch({ type: "add" })}
          >
            Adaugă în coș <Arrow />
          </button>
          <p className="shop-demo-price-note">
            Prețuri de exemplu, nu tarife CODELAB. Fără comenzi reale.
          </p>
          <div className="shop-cart">
            <button
              type="button"
              className="shop-cart-toggle"
              aria-expanded={state.open}
              aria-controls="shop-cart-summary"
              onClick={() => dispatch({ type: "toggle" })}
              ref={cartToggle}
            >
              Coșul demo{" "}
              <span>
                {totalCount} {totalCount === 1 ? "produs" : "produse"}
                <Arrow />
              </span>
            </button>
            <div className="shop-cart-disclosure" data-open={state.open}>
              <div className="shop-cart-overflow">
                <section
                  id="shop-cart-summary"
                  className="shop-cart-content"
                  aria-label="Sumarul coșului demonstrativ"
                  aria-hidden={!state.open}
                  inert={!state.open}
                >
                  {totalCount ? (
                    <>
                      {(Object.keys(formats) as Format[])
                        .filter((format) => state.cart[format] > 0)
                        .map((format) => (
                          <div className="shop-cart-item" key={format}>
                            <div>
                              <strong>Carnet de idei / {format}</strong>
                              <span>
                                {state.cart[format]}{" "}
                                {state.cart[format] === 1 ? "bucată" : "bucăți"}{" "}
                                × {formats[format].price} lei
                              </span>
                            </div>
                            <button
                              type="button"
                              aria-label={`Elimină formatul ${format}`}
                              onClick={() => {
                                dispatch({ type: "remove", format });
                                cartToggle.current?.focus({
                                  preventScroll: true,
                                });
                              }}
                            >
                              Elimină
                            </button>
                          </div>
                        ))}
                      <div className="shop-cart-total">
                        <span>Total demonstrativ</span>
                        <strong>{total} lei</strong>
                      </div>
                      <p className="shop-cart-confirmation">
                        {state.cartMessage}
                      </p>
                    </>
                  ) : (
                    <p className="shop-empty-cart">
                      Coșul demo este gol. Alege formatul și adaugă un carnet.
                    </p>
                  )}
                  <button type="button" className="shop-reset" onClick={reset}>
                    Resetează demonstrația <span aria-hidden="true">↺</span>
                  </button>
                </section>
              </div>
            </div>
          </div>
          <p
            className="shop-announcement"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            {state.message}
          </p>
        </div>
      </div>
    </section>
  );
}
