import type { Metadata } from "next";
import { ContactForm } from "@/components/contact-form";
import { Arrow } from "@/components/icons";
import { contactEmail } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Contact — CODELAB",
  description:
    "Spune-ne despre proiectul tău: website, magazin online sau aplicație web. Trimite brief-ul către CODELAB și îți răspundem pe email.",
};

export default function ContactPage() {
  return (
    <main id="main" className="contact-editorial gutter">
      <header className="contact-editorial-intro">
        <span>Contact</span>
        <div>
          <h1>
            Spune-ne despre
            <br />
            <span>proiect.</span>
          </h1>
          <p>
            Ce ai în minte și de unde pornești? Nu trebuie să ai toate
            răspunsurile. Câteva detalii sunt suficiente pentru un prim brief.
          </p>
        </div>
      </header>
      <div className="contact-editorial-grid">
        <aside className="contact-editorial-aside" aria-label="Despre contact">
          <div>
            <h2>Începem de aici.</h2>
            <a className="contact-direct" href={`mailto:${contactEmail}`}>
              {contactEmail}
              <Arrow diagonal />
            </a>
            <p>
              Poți scrie direct sau poți trimite detaliile proiectului prin
              formular.
            </p>
          </div>
          <a className="contact-projects-link" href="/proiecte">
            Explorează proiectele <Arrow diagonal />
          </a>
        </aside>
        <ContactForm />
      </div>
    </main>
  );
}
