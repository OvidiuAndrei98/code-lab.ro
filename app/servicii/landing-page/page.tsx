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

const ServicesPage: React.FC = () => {
  return (
    <div>
      <div
        className={`landing-page-banner relative m-[0_auto_80px_auto] md:m-[90px_auto_100px_auto] rounded-b-md md:rounded-md`}
      >
        <div className="absolute top-[9rem] p-4 flex flex-col items-center md:items-start gap-4 md:max-w-[70%] md:p-8">
          <h1 className="text-white font-semibold text-2xl md:text-3xl text-center md:text-start">
            Maximize Your Campaigns with Targeted Landing Pages
          </h1>
          <span className="text-[#e8e8e8] font-light text-md md:text-xl text-center md:text-start">
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
      <div className="mb-[80px]">
        <div className="text-white flex flex-col justify-center items-center gap-4 p-4 max-w-[700px] mx-[auto]">
          <h1 className="text-center text-center text-2xl font-bold">
            BENEFITS
          </h1>
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
          <h1 className="text-center text-center text-2xl font-bold">PRICES</h1>
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
