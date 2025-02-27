import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import LetterGlitch from "../letter-glitch/LetterGlitch";

const ServicesSection = () => {
  return (
    <div id="services" className="pt-[100px] section">
      <div className="text-white flex flex-col justify-center items-center gap-4 p-4">
        <span className="text-center text-xl text-[#C8C8C8]">SERVICES</span>
        <span className="text-center text-center text-4xl font-bold">
          Crafting Stunning Websites That Drive Results
        </span>
        <span className="text-center text-lg font-extralight">
          Custom web development, stunning design, and seamless user
          experiences—tailored for your success. Let’s bring your vision to
          life!
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:max-w-[1200px] mx-auto">
        <Accordion
          type="single"
          collapsible
          className="w-full text-white flex flex-col gap-4 p-4 md:mt-8"
        >
          <AccordionItem value="item-1" className="border-none">
            <AccordionTrigger className="bg-[#121212] rounded-[12px_12px_0_0] p-4 md:p-8">
              Web Development
            </AccordionTrigger>
            <AccordionContent className="bg-[#121212] rounded-[0_0_12px_12px] p-4 md:p-8">
              We build websites that are fast, secure, and easy to manage. We
              use the latest technologies to ensure your website is always
              up-to-date.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2" className="border-none">
            <AccordionTrigger className="bg-[#121212] bg-[#121212] rounded-[12px_12px_0_0] p-4 md:p-8">
              Custom Design
            </AccordionTrigger>
            <AccordionContent className="bg-[#121212] bg-[#121212] rounded-[0_0_12px_12px] p-4 md:p-8">
              We create custom designs that are unique to your brand. Our
              designs are modern, clean, and user-friendly.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3" className="border-none">
            <AccordionTrigger className="bg-[#121212] bg-[#121212] rounded-[12px_12px_0_0] p-4 md:p-8">
              SEO Optimization
            </AccordionTrigger>
            <AccordionContent className="bg-[#121212] bg-[#121212] rounded-[0_0_12px_12px] p-4 md:p-8">
              We optimize your website for search engines to ensure you rank
              higher in search results. This helps drive more traffic to your
              website.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        <div className="w-full h-[300px] p-4 md:h-[400px]">
          <LetterGlitch
            glitchSpeed={70}
            centerVignette={false}
            outerVignette={true}
            smooth={true}
            glitchColors={["#352a4c", "#352a4c", "#7D5BC0"]}
          />
        </div>
      </div>
    </div>
  );
};

export default ServicesSection;
