"use client";

import React from "react";
import "./LandingPage.css";
import Link from "next/link";
import SpotlightCard from "@/components/spotlight-card/SpotlightCard";
import { Separator } from "@radix-ui/react-separator";
import { CheckIcon } from "lucide-react";
import { DashboardIcon } from "@radix-ui/react-icons";
import Contact from "@/app/components/contact/Contact";
import Methodology from "@/app/components/methodology/Methodology";
import Aurora from "@/components/aurora/Aurora";

const ServicesPage: React.FC = () => {
  return (
    <div className="landing-page-service-container">
      <Aurora
        colorStops={["#4E26E2", "#000000", "#953DF5"]}
        blend={0.8}
        amplitude={0.5}
        speed={1.2}
      />
      <div className="mb-[80px]">
        <div className="flex flex-col justify-center items-center  mb-[80px]">
          <h1 className="text-white text-[23px] ">Website de prezentare</h1>
          <h1 className="text-white text-[50px] pb-2">
            Convinge vizitatorii să cumpere!
          </h1>
          <h1 className="text-white text-[23px] ">
            Alege pachetul perfect pentru un landing page de succes!
          </h1>
        </div>
        <div className="text-white flex flex-col justify-center items-center gap-4 p-4 max-w-[700px] mx-[auto]">
          <h1 className="text-center  text-2xl font-bold">BENEFITS</h1>
          <span className="text-center text-lg font-extralight">
            Capture More Leads, Grow Your Business.
          </span>
        </div>
        <div className="flex flex-col items-center md:flex-row md:flex-wrap md:justify-center gap-4 max-w-[1200px] mx-[auto] xl:flex-nowrap">
          <div className="benefit-card xl:!max-w-[290px]">
            <div className="p-8 bg-[#641F96] inline-block rounded-full max-w-[80px] mb-4">
              <DashboardIcon />
            </div>
            Modern design.
            <span>
              Landing pages are designed with a single, clear objective,
              eliminating distractions and guiding visitors toward a specific
              action.
            </span>
          </div>
          <div className="benefit-card xl:!max-w-[290px]">
            <div className="p-8 bg-[#167D90] inline-block rounded-full max-w-[80px] mb-4">
              <DashboardIcon />
            </div>
            Modern design.
            <span>
              Landing pages are designed with a single, clear objective
            </span>
          </div>
          <div className="benefit-card xl:!max-w-[290px]">
            <div className="p-8 bg-[#755E85] inline-block rounded-full max-w-[80px] mb-4">
              <DashboardIcon />
            </div>
            Modern design.
            <span>
              Landing pages are designed with a single, clear objective
            </span>
          </div>
          <div className="benefit-card xl:!max-w-[290px]">
            <div className="p-8 bg-[#4B836A] inline-block rounded-full max-w-[80px] mb-4">
              <DashboardIcon />
            </div>
            Modern design.
            <span>
              Landing pages are designed with a single, clear objective
            </span>
          </div>
        </div>
      </div>
      <div>
        <div className="text-white flex flex-col justify-center items-center gap-4 p-4 max-w-[700px] mx-[auto]">
          <h1 className="text-center text-2xl font-bold">PRICES</h1>
          <span className="text-center text-lg font-extralight">
            Choose the perfect package for your bussines.
          </span>
        </div>
        <div className="text-white flex flex-col items-center gap-4 md:flex-row md:h-[480px] md:justify-center">
          <SpotlightCard
            className="custom-spotlight-card w-full max-w-[356px] h-full"
            spotlightColor="rgba(114, 49, 236, 0.24)"
          >
            <h3 className="text-xl">Basic</h3>
            <span className="text-[#C8C8C8] text-sm">1 page</span>
            <Separator className="my-4" />
            <span className="text-5xl font-bold">400€</span>
            <Link
              className="bg-[#7231EC] hover:bg-[#5d16e0] text-md md:text-xl p-4 md:p-5 rounded-[8px] mt-8 md:mt-4 w-full inline-block text-center"
              href="/"
            >
              Book now
            </Link>
            <Separator className="my-4" />
            <div className="flex space-x-2">
              <CheckIcon />
              <span className="font-extralight text-sm">Design in Figma</span>
            </div>
            <div className="flex space-x-2">
              <CheckIcon />
              <span className="font-extralight text-sm">
                Custom development
              </span>
            </div>
            <div className="flex space-x-2">
              <CheckIcon />
              <span className="font-extralight text-sm">
                SEO optimization & maintenance
              </span>
            </div>
            <div className="flex space-x-2">
              <CheckIcon />
              <span className="font-extralight text-sm">
                Mobile-responsive design
              </span>
            </div>
            <div className="flex space-x-2">
              <CheckIcon />
              <span className="font-extralight text-sm">
                Simple contact/lead capture form.
              </span>
            </div>
            <div className="flex space-x-2">
              <CheckIcon />
              <span className="font-extralight text-sm">
                5-7 business days delivery time
              </span>
            </div>
          </SpotlightCard>
          <SpotlightCard
            className="custom-spotlight-card w-full max-w-[356px] h-full"
            spotlightColor="rgba(114, 49, 236, 0.24)"
          >
            <h3 className="text-xl">Standard</h3>
            <span className="text-[#C8C8C8] text-sm">1 oage</span>
            <Separator className="my-4" />
            <span className="text-5xl font-bold">600€</span>
            <Link
              className="bg-[#7231EC] hover:bg-[#5d16e0] text-md md:text-xl p-4 md:p-5 rounded-[8px] mt-8 md:mt-4 w-full inline-block text-center"
              href="/"
            >
              Book now
            </Link>
            <Separator className="my-4" />
            <div className="flex space-x-2">
              <CheckIcon />
              <span className="font-extralight text-sm">Design in Figma</span>
            </div>
            <div className="flex space-x-2">
              <CheckIcon />
              <span className="font-extralight text-sm">
                Custom development
              </span>
            </div>
            <div className="flex space-x-2">
              <CheckIcon />
              <span className="font-extralight text-sm">
                SEO optimization & maintenance
              </span>
            </div>
            <div className="flex space-x-2">
              <CheckIcon />
              <span className="font-extralight text-sm">
                Mobile-responsive design
              </span>
            </div>
            <div className="flex space-x-2">
              <CheckIcon />
              <span className="font-extralight text-sm">
                Advanced form integration.
              </span>
            </div>
            <div className="flex space-x-2">
              <CheckIcon />
              <span className="font-extralight text-sm">
                Google Analytics integration.
              </span>
            </div>
            <div className="flex space-x-2">
              <CheckIcon />
              <span className="font-extralight text-sm">
                Conversion tracking setup.
              </span>
            </div>
            <div className="flex space-x-2">
              <CheckIcon />
              <span className="font-extralight text-sm">
                10-14 business days delivery time
              </span>
            </div>
          </SpotlightCard>
        </div>
      </div>
      <Methodology />
      <Contact />
    </div>
  );
};

export default ServicesPage;
