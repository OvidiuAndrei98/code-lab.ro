import React from "react";
import "./OnlineShop.css";
import Link from "next/link";

const ServicesPage: React.FC = () => {
  return (
    <div>
      <div
        className={`landing-page-banner relative top-0 md:top-[100px] rounded-b-md md:rounded-md`}
      >
        <div className="absolute top-[9rem] p-4 flex flex-col items-center md:items-start gap-4 md:max-w-[70%] md:p-8">
          <h1 className="text-white font-semibold text-2xl md:text-3xl text-center md:text-start">
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
