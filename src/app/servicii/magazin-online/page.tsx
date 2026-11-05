import type { Metadata } from "next";
import { Arrow } from "@/components/icons";
import { ShopDemonstration } from "@/components/shop-demonstration";

export const metadata: Metadata = {
  title: "Magazine online — CODELAB",
  description:
    "Magazine online cu prezentare de produs, catalog, variante, coș și administrarea comenzilor. Descoperă o demonstrație interactivă CODELAB.",
};

export default function OnlineStoreServicePage() {
  return (
    <main id="main" className="shop-service-page">
      <header className="shop-introduction gutter">
        <nav className="shop-breadcrumb" aria-label="Traseu pagină">
          <a href="/servicii">Servicii</a>
          <span aria-hidden="true">/</span>
          <span aria-current="page">Magazin online</span>
        </nav>
        <div className="shop-introduction-grid">
          <h1>
            Magazine
            <br className="shop-mobile-break" /> online.
          </h1>
          <div>
            <p>
              Construim magazine online: de la prezentarea produselor și
              alegerea variantelor, la coș și administrarea comenzilor.
            </p>
            <a href="/contact" className="shop-agency-link">
              Discutăm despre magazin <Arrow diagonal />
            </a>
          </div>
        </div>
      </header>
      <ShopDemonstration />
      <section
        className="shop-service-context gutter"
        aria-label="Experiența de cumpărare și administrarea magazinului"
      >
        <div className="shop-buyer-context">
          <span className="shop-context-label">Experiența de cumpărare</span>
          <h2>
            Pentru cei
            <br />
            care cumpără.
          </h2>
          <p>
            Produse ușor de găsit și variante ușor de ales. Punem în ordine
            imaginile, informațiile și pașii până la comandă.
          </p>
          <div className="shop-context-deliverables">
            <span>Catalog & variante</span>
            <span>Coș & checkout</span>
            <span>Plăți online</span>
          </div>
        </div>
        <div className="shop-owner-context">
          <span className="shop-context-label">În spatele magazinului</span>
          <h2>
            Și pentru cei
            <br />
            care administrează.
          </h2>
          <p>
            Ne ocupăm și de partea de administrare: produse, comenzi și
            informațiile necesare pentru livrare. Stabilim împreună ce are
            nevoie magazinul tău.
          </p>
          <span className="shop-owner-note">
            Administrarea se construiește în jurul modului tău de lucru.
          </span>
        </div>
      </section>
      <section
        className="shop-service-contact gutter"
        aria-labelledby="shop-contact-title"
      >
        <h2 id="shop-contact-title">
          Ce vrei
          <br />
          să vinzi?
        </h2>
        <div>
          <p>
            Spune-ne ce produse ai și cum vrei să le prezinți. Pornim de aici cu
            un brief pentru magazinul tău.
          </p>
          <a href="/contact" className="shop-contact-button">
            Discutăm despre magazinul tău <Arrow diagonal />
          </a>
          <a href="/servicii" className="shop-contact-secondary">
            Toate serviciile <Arrow diagonal />
          </a>
        </div>
      </section>
    </main>
  );
}
