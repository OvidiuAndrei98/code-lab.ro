"use client";

import { useState } from "react";
import { Arrow } from "./icons";
import { WordmarkLetters } from "./codelab-wordmark";

const formats = { A3: 90, A2: 120 };
type Format = keyof typeof formats;
const days = ["Luni", "Marți", "Miercuri"];
const slots = ["10:00", "11:30", "14:00", "15:30"];

export function CommerceExample() {
  const [format, setFormat] = useState<Format>("A3");
  const [cart, setCart] = useState<Format[]>([]);
  const total = cart.reduce((sum, item) => sum + formats[item], 0);
  return (
    <div className="commerce-example service-example">
      <div className="example-topline">
        <span>Demo e-commerce</span>
        <span>Coș ({cart.length})</span>
      </div>
      <div className="commerce-grid">
        <div className="poster-surround">
          <div
            className="brand-print"
            role="img"
            aria-label="Poster demonstrativ cu identitatea CODELAB"
          >
            <span className="print-top">
              CODELAB
              <br />
              STUDIO EDITION
            </span>
            <div className="print-wordmark">
              <WordmarkLetters />
            </div>
            <span className="print-bottom">
              Design & development
              <br />
              București, RO
            </span>
          </div>
        </div>
        <div className="example-product">
          <span className="example-overline">Print de studio</span>
          <h3>
            Poster
            <br />
            CODELAB.
          </h3>
          <p className="example-price">{formats[format]} lei</p>
          <fieldset className="example-options">
            <legend>Format</legend>
            {(Object.keys(formats) as Format[]).map((size) => (
              <label key={size}>
                <input
                  type="radio"
                  name="poster-format"
                  value={size}
                  checked={format === size}
                  onChange={() => setFormat(size)}
                />
                <span>{size}</span>
              </label>
            ))}
          </fieldset>
          <button
            type="button"
            className="example-button"
            onClick={() => setCart((items) => [...items, format])}
          >
            Adaugă în coș <Arrow />
          </button>
        </div>
      </div>
      <div className="example-result">
        <p role="status" aria-live="polite">
          {cart.length
            ? `${cart.length} ${cart.length === 1 ? "poster" : "postere"} în coș · ${total} lei`
            : "Coșul demo este gol."}
        </p>
        {cart.length > 0 && (
          <button
            type="button"
            className="example-reset"
            onClick={() => setCart([])}
          >
            Golește coșul
          </button>
        )}
      </div>
      <p className="example-note">
        Exemplu interactiv. Nu se plasează comenzi.
      </p>
    </div>
  );
}

export function BookingExample() {
  const [day, setDay] = useState("Luni");
  const [slot, setSlot] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState("");
  function changeDay(value: string) {
    setDay(value);
    setSlot(null);
    setConfirmed("");
  }
  return (
    <div className="booking-example service-example">
      <div className="example-topline">
        <span>Demo aplicație web</span>
        <span>Programări</span>
      </div>
      <div className="booking-grid">
        <h3>
          Alege un
          <br />
          interval.
        </h3>
        <div className="booking-controls">
          <fieldset className="example-options booking-days">
            <legend>Ziua</legend>
            {days.map((value) => (
              <label key={value}>
                <input
                  type="radio"
                  name="booking-day"
                  value={value}
                  checked={day === value}
                  onChange={() => changeDay(value)}
                />
                <span>{value}</span>
              </label>
            ))}
          </fieldset>
          <fieldset className="booking-slots example-options">
            <legend>Intervalul</legend>
            {slots.map((value) => (
              <label key={value}>
                <input
                  type="radio"
                  name="booking-slot"
                  value={value}
                  checked={slot === value}
                  onChange={() => {
                    setSlot(value);
                    setConfirmed("");
                  }}
                />
                <span>{value}</span>
              </label>
            ))}
          </fieldset>
          <button
            type="button"
            className="example-button"
            disabled={!slot}
            onClick={() => setConfirmed(`Interval selectat: ${day}, ${slot}.`)}
          >
            Confirmă în demo <Arrow />
          </button>
          <p className="booking-result" role="status" aria-live="polite">
            {confirmed || "Alege ziua și ora pentru a testa fluxul."}
          </p>
        </div>
      </div>
      <p className="example-note">
        Exemplu interactiv. Nu se face o rezervare reală.
      </p>
    </div>
  );
}
