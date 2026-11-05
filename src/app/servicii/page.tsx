import type { Metadata } from "next";
import { Arrow } from "@/components/icons";
import { services } from "@/lib/services";
import styles from "./services-index.module.css";

export const metadata: Metadata = {
  title: "Servicii — CODELAB",
  description:
    "Website-uri pentru prezentarea afacerii, magazine online pentru produse și cumpărare, aplicații web pentru procesele tale. Alege direcția potrivită cu CODELAB.",
};

const indexContent = {
  website: {
    name: "Website-uri",
    description:
      "Pentru a prezenta afacerea, oferta și felul în care oamenii pot ajunge la tine.",
    detail: "Prezentare · Conținut · Contact",
  },
  ecommerce: {
    name: "Magazin online",
    description:
      "Un magazin în care clienții găsesc produsele, aleg variantele și plasează comanda.",
    detail: "Produse · Coș · Comenzi",
  },
  aplicatii: {
    name: "Aplicații web",
    description:
      "Pentru procese și instrumente construite în jurul modului tău de lucru.",
    detail: "Programări · Conturi client · Instrumente pentru echipă",
  },
} as const;

export default function ServicesPage() {
  return (
    <main id="main" className={styles.page} data-services-index>
      <header className={`${styles.introduction} gutter`}>
        <span className={styles.label}>Servicii</span>
        <div className={styles.introductionGrid}>
          <h1>Ce construim.</h1>
          <p>
            Design și dezvoltare, în aceeași echipă. Alegem împreună ce se
            potrivește proiectului tău.
          </p>
        </div>
      </header>

      <div className={`${styles.entries} gutter`}>
        {services.map((service) => {
          const entry = indexContent[service.id];
          return (
            <section
              key={service.id}
              id={service.id}
              className={styles.entry}
              aria-labelledby={`${service.id}-title`}
              data-service-entry
            >
              <a
                className={styles.entryLink}
                href={service.href}
                aria-labelledby={`${service.id}-title`}
                aria-describedby={`${service.id}-description`}
              >
                <h2 id={`${service.id}-title`}>{entry.name}</h2>
                <div className={styles.entryCopy}>
                  <p id={`${service.id}-description`}>{entry.description}</p>
                  <span>{entry.detail}</span>
                </div>
                <span className={styles.entryAction}>
                  <span>Vezi serviciul</span> <Arrow diagonal />
                </span>
              </a>
            </section>
          );
        })}
      </div>

      <section
        className={`${styles.contact} gutter`}
        aria-labelledby="services-contact-title"
      >
        <div>
          <span className={styles.label}>Pornim de la proiectul tău</span>
          <h2 id="services-contact-title">
            Nu e nevoie
            <br />
            să alegi acum.
          </h2>
        </div>
        <div className={styles.contactCopy}>
          <p>
            Spune-ne ce vrei să prezinți, să vinzi sau să organizezi. Stabilim
            împreună ce soluție are sens.
          </p>
          <a href="/contact?service=indecis" className={styles.contactLink}>
            <span>Discutăm despre proiect</span> <Arrow diagonal />
          </a>
        </div>
      </section>
    </main>
  );
}
