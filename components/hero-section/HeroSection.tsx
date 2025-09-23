"use client";
import Aurora from "../aurora/Aurora";
import RotatingText from "../rotating-text/RotatingText";
import AnimatedContent from "@/components/animated-content/AnimatedContent";
import Link from "next/link";
import Texture from "../../public/texture.svg";
import Image from "next/image";
import { Button } from "../ui/button";
import ShinyText from "../shiny-text/ShinyText";

const HeroSection = () => {
  return (
    <div className="h-[720px] lg:h-[820px] w-full relative">
      <Image
        src={Texture}
        className=" opacity-5 absolute select-none
        top-0 left-0 w-full h-full object-cover "
        alt="Background Texture"
      />
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

        {/* <Link
          className="bg-[#7231EC] hover:bg-[#5d16e0] text-md md:text-xl p-4 md:p-5 rounded-[8px] mt-8 md:mt-4"
          href="https://calendly.com/contact-code-lab/discovery-call"
          target="_blank"
        >
          Schedule a 30 min call
        </Link> */}
        <Link
          href="https://calendly.com/contact-code-lab/discovery-call"
          target="_blank"
        >
          <Button
            variant="ghost"
            className="p-6 navbar-button rounded-full font-light backdrop-blur-sm text-[#d2d2d2] border border-[#d2d2d29d] hover:bg-[#d2d2d2] hover:text-black"
          >
            <ShinyText
              text="Schedule a 30 min call"
              disabled={false}
              speed={3}
            />
          </Button>
          {/* <div className="items-center justify-center gap-x-3 space-y-3 sm:flex sm:space-y-0">
            {" "}
            <span className="relative inline-block overflow-hidden rounded-full p-[1.5px]">
              <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#a45efb_100%)]" />
              <div className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full  bg-gray-950 text-xs font-medium backdrop-blur-3xl">
                <a className="inline-flex rounded-full text-center group items-center w-full justify-center bg-gradient-to-tr from-zinc-300/5 via-[#7e4dd8] text-white border-input border-[1px] border-[#27272A] hover:bg-gradient-to-tr  hover:to-transparent hover:from-zinc-300/10 hover:via-purple-400/30 transition-all sm:w-auto py-4 px-10">
                  Schedule a 30 min call
                </a>
              </div>
            </span>
          </div>
          <button className="px-7 py-3 rounded-full font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white transition-all duration-300 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:-translate-y-1 text-sm font-sfpro">
            Schedule a 30 min call
          </button> */}
        </Link>
      </AnimatedContent>
    </div>
  );
};

export default HeroSection;
