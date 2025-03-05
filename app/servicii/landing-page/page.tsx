import React from "react";
import "./LandingPage.css";
import Link from "next/link";

const ServicesPage: React.FC = () => {
  return (
    <div>
      <div className="landing-page-banner relative">
        <div className="absolute top-[40%] p-8 max-w-[70%] flex flex-col gap-4">
          <h1 className="text-white font-semibold text-3xl">
            Maximize Your Campaigns with Targeted Landing Pages
          </h1>
          <span className="text-[#e8e8e8] font-light text-lg">
            Drive conversions and boost your sales with our expert landing page
            creation services. We design custom landing pages that are not only
            visually appealing but also strategically optimized to turn visitors
            into loyal customers. Contact us today and start maximizing your
            online potential.
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
