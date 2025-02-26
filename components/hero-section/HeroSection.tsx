import Aurora from "../aurora/Aurora";
import RotatingText from "../rotating-text/RotatingText";
import { Button } from "@/components/ui/button";

const HeroSection = () => {
  return (
    <div className="h-[100vh] w-full ">
      <Aurora
        colorStops={["#4E26E2", "rgba(80, 40, 226, 0.81)", "#953DF5"]}
        blend={0.8}
        amplitude={0.3}
        speed={0.5}
      />
      <div className="text-white top-[20%] sm:px-4 md:top-[30%]  w-full mx-auto my-0 absolute flex flex-col justify-center items-center gap-0 md:gap-4">
        <p className="text-[40px] md:text-[60px] text-center font-bold leading-[40px] md:leading-[70px]">
          Building Next-Gen Websites
        </p>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-2 justify-center items-center">
          <p className="text-[40px] md:text-[60px] text-center font-bold leading-[40px] md:leading-[70px]">
            That Drive
          </p>
          <RotatingText
            texts={["Succes", "Results"]}
            mainClassName="px-2 sm:px-2 md:px-3 bg-[#7231EC] text-[30px] md:text-[60px] font-bold  text-black overflow-hidden py-0.5 sm:py-1 md:py-2 justify-center rounded-lg max-w-[300px]"
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
        <Button className="bg-[#7231EC] hover:bg-[#5d16e0] text-md md:text-xl p-5 md:p-6 rounded-[8px] mt-8 md:mt-4">
          Schedule a 30 min call
        </Button>
      </div>
    </div>
  );
};

export default HeroSection;
