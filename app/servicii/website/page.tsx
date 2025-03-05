import React from "react";
import "./Website.css";
import Link from "next/link";

const ServicesPage: React.FC = () => {
  return (
    <div>
      <div className="landing-page-banner relative">
        <div className="absolute top-[40%] p-8 max-w-[70%] flex flex-col gap-4">
          <h1 className="text-white font-semibold text-3xl">
            Transformă-ți Prezența Online cu un Site Web de Impact
          </h1>
          <span className="text-[#e8e8e8] font-light text-lg">
            Un site web profesional este cartea de vizită online a afacerii
            tale. Echipa noastră de experți în dezvoltare web creează site-uri
            web personalizate, moderne și performante, care te ajută să îți
            atingi obiectivele de business.
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
