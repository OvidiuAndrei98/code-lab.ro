"use client";
import Aurora from "../aurora/Aurora";
import RotatingText from "../rotating-text/RotatingText";
import AnimatedContent from "@/components/animated-content/AnimatedContent";
import Link from "next/link";

const HeroSection = () => {
  return (
    <div className="h-[720px] lg:h-[820px] w-full relative">
      <Aurora
        colorStops={["#4E26E2", "#000000", "#953DF5"]}
        blend={0.8}
        amplitude={0.5}
        speed={1.2}
      />

      <AnimatedContent
        distance={150}
        direction="vertical"
        reverse={false}
        config={{ tension: 80, friction: 20 }}
        initialOpacity={0.2}
        animateOpacity
        scale={1}
        threshold={0.2}
        classNamme={
          "text-white top-[25%] px-4 md:top-[30%]  w-full mx-auto my-0 absolute flex flex-col justify-center items-center gap-0 md:gap-4 h-[60%]"
        }
      >
        <p className="text-[48px] md:text-[60px] text-center font-bold leading-[48px] md:leading-[70px]">
          Building Next-Gen Websites
        </p>
        <div className="md:grid grid-cols-1 md:grid-cols-[1fr_300px] flex flex-col gap-2 justify-center items-center">
          <p className="text-[48px] md:text-[60px] text-center font-bold leading-[48px] md:leading-[70px]">
            That Drive
          </p>
          <RotatingText
            texts={["Succes", "Results", "Growth"]}
            mainClassName="px-2 sm:px-2 md:px-3 bg-[#7231EC] w-[300px] text-[48px] md:text-[60px] font-bold  text-black overflow-hidden py-0.5 sm:py-1 md:py-2 justify-center rounded-lg max-w-[300px]"
            staggerFrom={"last"}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "-120%" }}
            staggerDuration={0.04}
            splitLevelClassName="overflow-hidden pb-0.5 sm:pb-1 md:pb-1"
            transition={{ type: "spring", damping: 30, stiffness: 400 }}
            rotationInterval={2500}
          />
        </div>
        <p className=" text-center text-lg md:text-xl font-extralight mt-5">
          Custom web development, stunning design, and seamless user
          experiences—tailored <br /> for your success. Let’s bring your vision
          to life!
        </p>

        <Link
          className="bg-[#7231EC] hover:bg-[#5d16e0] text-md md:text-xl p-4 md:p-5 rounded-[8px] mt-8 md:mt-4"
          href="https://calendly.com/contact-code-lab/discovery-call"
          target="_blank"
        >
          Schedule a 30 min call
        </Link>
      </AnimatedContent>
    </div>
  );
};

export default HeroSection;
