import SpotlightCard from "@/components/spotlight-card/SpotlightCard";
import { Separator } from "@/components/ui/separator";
import { CheckIcon } from "lucide-react";
import Link from "next/link";
import React from "react";

const PricesSection: React.FC = () => {
  return (
    <div
      id="prices"
      className="section w-full flex flex-col justify-center pt-[85px] relative px-4 max-w-[1200px] mx-[auto]"
    >
      <div className="max-w-[1200px] mx-[auto] w-full flex flex-col justify-center gap-4 max-w-[700px]">
        <span className="text-center text-xl text-[#C8C8C8] ">PRICES</span>
        <h1 className="text-center text-white text-4xl font-bold">
          Pricing plans
        </h1>
        <h3 className="text-center text-white text-lg font-extralight">
          Unlock the full potential of your online presence with our tailored
          packages
        </h3>
      </div>
      <div className="flex justify-center mt-6 text-white flex-wrap gap-5">
        <SpotlightCard
          className="custom-spotlight-card flex flex-col w-full max-w-[356px] "
          spotlightColor="rgba(114, 49, 236, 0.24)"
        >
          <h3 className="text-xl">Landing page</h3>
          <span className="text-[#C8C8C8] text-sm">1 page</span>
          <Separator className="my-4" />
          <span className="text-5xl font-bold">
            <span className="font-extralight text-sm">from</span> 500€
          </span>
          <Link
            className="bg-[#7231EC] hover:bg-[#5d16e0] text-md md:text-xl p-4 md:p-5 rounded-[8px] mt-8 md:mt-4 w-full inline-block text-center"
            href="https://calendly.com/contact-code-lab/discovery-call"
            target="_blank"
          >
            See more
          </Link>
          <Separator className="my-4" />
          <div className="flex space-x-2">
            <CheckIcon />
            <span className="font-extralight text-sm">Design in Figma</span>
          </div>
          <div className="flex space-x-2">
            <CheckIcon />
            <span className="font-extralight text-sm">Custom development</span>
          </div>
          <div className="flex space-x-2">
            <CheckIcon />
            <span className="font-extralight text-sm">
              SEO optimization & maintenance
            </span>
          </div>
        </SpotlightCard>
        <SpotlightCard
          className="custom-spotlight-card w-full max-w-[356px]  lg:"
          spotlightColor="rgba(114, 49, 236, 0.24)"
        >
          <h3 className="text-xl">Small website</h3>
          <span className="text-[#C8C8C8] text-sm">2+ pages</span>
          <Separator className="my-4" />
          <span className="text-5xl font-bold">
            <span className="font-extralight text-sm">from</span> 750€
          </span>
          <Link
            className="bg-[#7231EC] hover:bg-[#5d16e0] text-md md:text-xl p-4 md:p-5 rounded-[8px] mt-8 md:mt-4 w-full inline-block text-center"
            href="https://calendly.com/contact-code-lab/discovery-call"
            target="_blank"
          >
            See more
          </Link>
          <Separator className="my-4" />
          <div className="flex space-x-2">
            <CheckIcon />
            <span className="font-extralight text-sm">Design in Figma</span>
          </div>
          <div className="flex space-x-2">
            <CheckIcon />
            <span className="font-extralight text-sm">Custom development</span>
          </div>
          <div className="flex space-x-2">
            <CheckIcon />
            <span className="font-extralight text-sm">
              SEO optimization & maintenance
            </span>
          </div>
        </SpotlightCard>
        <SpotlightCard
          className="custom-spotlight-card w-full max-w-[356px] "
          spotlightColor="rgba(114, 49, 236, 0.24)"
        >
          <h3 className="text-xl">Online shop</h3>
          <span className="text-[#C8C8C8] text-sm">3+ pages</span>
          <Separator className="my-4" />
          <span className="text-5xl font-bold">
            <span className="font-extralight text-sm">from</span> 750€
          </span>
          <Link
            className="bg-[#7231EC] hover:bg-[#5d16e0] text-md md:text-xl p-4 md:p-5 rounded-[8px] mt-8 md:mt-4 w-full inline-block text-center"
            href="https://calendly.com/contact-code-lab/discovery-call"
            target="_blank"
          >
            See more
          </Link>
          <Separator className="my-4" />
          <div className="flex space-x-2">
            <CheckIcon />
            <span className="font-extralight text-sm">Design in Figma</span>
          </div>
          <div className="flex space-x-2">
            <CheckIcon />
            <span className="font-extralight text-sm">Custom development</span>
          </div>
          <div className="flex space-x-2">
            <CheckIcon />
            <span className="font-extralight text-sm">
              SEO optimization & maintenance
            </span>
          </div>
          <div className="flex space-x-2">
            <CheckIcon />
            <span className="font-extralight text-sm">CMS integrations</span>
          </div>
        </SpotlightCard>
        <SpotlightCard
          className="custom-spotlight-card w-full max-w-[356px]"
          spotlightColor="rgba(114, 49, 236, 0.24)"
        >
          <h3 className="text-xl">Web application</h3>
          <span className="text-[#C8C8C8] text-sm">5+ pages</span>
          <Separator className="my-4" />
          <span className="text-5xl font-bold">
            <span className="font-extralight text-sm">from</span> 2000€
          </span>
          <Link
            className="bg-[#7231EC] hover:bg-[#5d16e0] text-md md:text-xl p-4 md:p-5 rounded-[8px] mt-8 md:mt-4 w-full inline-block text-center"
            href="https://calendly.com/contact-code-lab/discovery-call"
            target="_blank"
          >
            See more
          </Link>
          <Separator className="my-4" />
          <div className="flex space-x-2">
            <CheckIcon />
            <span className="font-extralight text-sm">Design in Figma</span>
          </div>
          <div className="flex space-x-2">
            <CheckIcon />
            <span className="font-extralight text-sm">Custom development</span>
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
              Third party application integration
            </span>
          </div>
        </SpotlightCard>
      </div>
    </div>
  );
};

export default PricesSection;
