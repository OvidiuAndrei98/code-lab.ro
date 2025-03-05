import React from "react";
import "./OnlineShop.css";
import Link from "next/link";

const ServicesPage: React.FC = () => {
  return (
    <div>
      <div className="landing-page-banner relative">
        <div className="absolute top-[40%] p-8 max-w-[70%] flex flex-col gap-4">
          <h1 className="text-white font-semibold text-3xl">
            Crește-ți Vânzările Online cu un Magazin Profesional
          </h1>
          <span className="text-[#e8e8e8] font-light text-lg">
            Transformați-vă afacerea cu un magazin online profesional și
            performant. Echipa noastră de experți vă oferă servicii complete de
            creare magazin online, de la concepție și design, până la lansare și
            optimizare.
          </span>
          <Link
            className="bg-[#7231EC] hover:bg-[#5d16e0] text-md md:text-xl p-4 md:p-5 rounded-[8px] mt-8 md:mt-4 max-w-[300px] text-white"
            href="https://calendly.com/contact-code-lab/discovery-call"
            target="_blank"
          >
            Descoperă pachetele
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ServicesPage;
