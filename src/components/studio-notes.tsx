"use client";

import { useEffect, useRef, useState } from "react";

const notes = [
  {
    id: "mobil",
    title: "Ordinea contează.",
    body: "Un titlu poate trece deasupra imaginii, iar o acțiune poate primi un loc mai vizibil. Păstrăm ce e esențial, fără să micșorăm pur și simplu pagina.",
    before: "Pe telefon, ",
    trigger: "adaptăm compoziția",
    after: " ca informația importantă să rămână ușor de găsit.",
    label: "Despre compoziția pe mobil",
  },
  {
    id: "formular",
    title: "Corectezi fără să reiei.",
    body: "Un câmp lipsă are un mesaj chiar lângă el. Informațiile deja completate rămân în formular, ca să poți continua de unde ai rămas.",
    before: "La formulare, ",
    trigger: "urmărim să fie clar",
    after: " ce completezi și cum corectezi o greșeală.",
    label: "Despre formulare și feedback",
  },
  {
    id: "interactiune",
    title: "Rezultatul trebuie să se vadă.",
    body: "O opțiune aleasă are o stare distinctă. După confirmare, arătăm rezultatul; dacă acțiunea poate fi anulată, păstrăm și o cale clară de revenire.",
    before: "Proiectăm și ",
    trigger: "ce se întâmplă după click",
    after: ": selecția, confirmarea și revenirea.",
    label: "Despre design și comportament",
  },
] as const;

export function StudioNotes() {
  const [active, setActive] = useState<string>(notes[0].id);
  const root = useRef<HTMLElement>(null);
  const previous = useRef(active);
  useEffect(() => {
    if (previous.current === active) return;
    previous.current = active;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const content = root.current?.querySelector<HTMLElement>(
      `#studio-note-${active} .studio-note-content`,
    );
    const animation = content?.animate([{ opacity: 0.6 }, { opacity: 1 }], {
      duration: 160,
      easing: "cubic-bezier(0.23, 1, 0.32, 1)",
    });
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const stop = () => animation?.cancel();
    preference.addEventListener("change", stop);
    return () => {
      animation?.cancel();
      preference.removeEventListener("change", stop);
    };
  }, [active]);

  const selected = notes.find((note) => note.id === active)!;
  return (
    <section
      className="studio-portrait-notes gutter"
      aria-labelledby="studio-notes-title"
      ref={root}
    >
      <header className="studio-notes-heading">
        <span className="studio-portrait-label">Note de studio</span>
        <div>
          <h2 id="studio-notes-title">
            Detalii de <br />
            lucru.
          </h2>
        </div>
      </header>
      <div className="studio-note-layout">
        {notes.map((note) => (
          <div className="studio-note-fragment" key={note.id}>
            <p className="studio-note-sentence">
              {note.before}
              <button
                type="button"
                className="studio-note-trigger"
                onClick={() => setActive(note.id)}
                onFocus={() => setActive(note.id)}
                aria-pressed={active === note.id}
                aria-controls={`studio-note-${note.id}`}
              >
                {note.trigger}
              </button>
              {note.after}
            </p>
            <aside
              id={`studio-note-${note.id}`}
              className="studio-margin-note"
              data-active={active === note.id}
              aria-label={note.label}
            >
              <div className="studio-note-content">
                <span className="studio-note-caption">În margine</span>
                <h3>{note.title}</h3>
                <p>{note.body}</p>
              </div>
            </aside>
          </div>
        ))}
      </div>
      <p className="studio-notes-announcement" role="status" aria-atomic="true">
        {selected.title} {selected.body}
      </p>
    </section>
  );
}
