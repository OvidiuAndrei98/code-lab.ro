import type { Metadata } from "next";
import { Arrow } from "@/components/icons";
import { RequestWorkspace } from "@/components/request-workspace";

export const metadata: Metadata = {
  title: "Aplicații web — CODELAB",
  description:
    "Aplicații web pentru programări, conturi de client și instrumente de echipă. Încearcă un flux demonstrativ cu solicitări, disponibilitate și anulare.",
};
export default function WebApplicationsPage() {
  return (
    <main id="main" className="app-service-page">
      <header className="app-introduction gutter">
        <nav className="app-breadcrumb" aria-label="Traseu pagină">
          <a href="/servicii">Servicii</a>
          <span aria-hidden="true">/</span>
          <span aria-current="page">Aplicații web</span>
        </nav>
        <div className="app-introduction-grid">
          <h1>
            Aplicații <span>web.</span>
          </h1>
          <div>
            <p>
              Programări, conturi de client sau instrumente pentru echipă.
              Construim interfețe și funcționalități în jurul modului tău de
              lucru.
            </p>
            <a href="/contact" className="app-agency-link">
              Discutăm despre aplicația ta <Arrow diagonal />
            </a>
          </div>
        </div>
      </header>
      <RequestWorkspace />
      <section
        className="app-editorial gutter"
        aria-labelledby="app-editorial-title"
      >
        <div className="app-editorial-heading">
          <span>Ce face o aplicație utilă</span>
          <h2 id="app-editorial-title">
            O acțiune.
            <br />
            <span>Totul, în acord.</span>
          </h2>
        </div>
        <div className="app-editorial-rules">
          <h3>
            Reguli adaptate
            <br />
            modului de lucru.
          </h3>
          <p>
            În demonstrație, un interval poate aparține unei singure solicitări.
            În proiectul tău, definim împreună condițiile de care trebuie să
            țină cont aplicația.
          </p>
        </div>
        <div className="app-editorial-coherence">
          <h3>
            Informații care
            <br />
            rămân coerente.
          </h3>
          <p>
            O programare actualizează solicitarea, lista și intervalele
            disponibile. Același principiu leagă informațiile din locurile
            relevante ale unei aplicații.
          </p>
        </div>
        <div className="app-editorial-clarity">
          <h3>
            Clar la alegere.
            <br />
            Clar și la revenire.
          </h3>
          <p>
            Selecția arată ce modifici, confirmarea îți spune ce s-a întâmplat,
            iar anularea îți permite să revii. Greșelile sunt prevenite înainte
            să încurce pașii următori.
          </p>
        </div>
      </section>
      <section className="app-needs gutter" aria-labelledby="app-needs-title">
        <h2 id="app-needs-title">De la o nevoie concretă.</h2>
        <div className="app-needs-list">
          <div>
            <h3>Programări</h3>
            <p>
              O vedere clară asupra solicitărilor și a intervalelor disponibile.
            </p>
          </div>
          <div>
            <h3>Conturi de client</h3>
            <p>
              Un loc în care oamenii găsesc informațiile și acțiunile care îi
              privesc.
            </p>
          </div>
          <div>
            <h3>Instrumente pentru echipă</h3>
            <p>
              Interfețe pentru organizarea activității, cu pași și reguli
              potrivite procesului.
            </p>
          </div>
        </div>
        <p className="app-needs-note">
          Sunt tipuri de soluții pe care le putem construi. Demonstrația de mai
          sus rulează doar în browser.
        </p>
      </section>
      <section
        className="app-service-contact gutter"
        aria-labelledby="app-contact-title"
      >
        <span>Începem cu procesul tău</span>
        <div>
          <h2 id="app-contact-title">
            Cum lucrezi
            <br />
            acum?
          </h2>
          <div>
            <p>
              Descrie un proces pe care vrei să-l organizezi sau să-l aduci
              într-o aplicație. Punem de aici în ordine ce trebuie să facă.
            </p>
            <a className="app-contact-button" href="/contact">
              Pregătește un brief pentru aplicație <Arrow diagonal />
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
