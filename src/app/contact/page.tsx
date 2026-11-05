import type { Metadata } from "next";
import { ContactForm } from "@/components/contact-form";
import { Arrow } from "@/components/icons";

export const metadata: Metadata = {
  title: "Contact — CODELAB",
  description:
    "Spune-ne despre proiectul tău: website, magazin online sau aplicație web. Pregătește un brief local pentru conversația cu CODELAB.",
};

export default function ContactPage() {
  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || "";
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
            {contactEmail ? (
              <a className="contact-direct" href={`mailto:${contactEmail}`}>
                {contactEmail}
                <Arrow diagonal />
              </a>
            ) : (
              <p>
                Pregătește și descarcă brief-ul. Informațiile rămân la tine.
              </p>
            )}
            <p>
              {contactEmail
                ? "Poți scrie direct sau poți aduna mai întâi ideile în formular."
                : "Trimiterea directă nu este disponibilă în această versiune."}
            </p>
          </div>
          <a className="contact-projects-link" href="/proiecte">
            Explorează proiectele <Arrow diagonal />
          </a>
        </aside>
        <ContactForm contactEmail={contactEmail} />
      </div>
    </main>
  );
}
