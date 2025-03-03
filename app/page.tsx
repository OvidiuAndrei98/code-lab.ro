// import Image from "next/image";
// import BackgroundImage from "@/public/background svg.svg";
// import Aurora from "@/components/aurora/Aurora";
import AnimatedSlider from "@/components/animated-slider/AnimatedSlider";
import HeroSection from "@/components/hero-section/HeroSection";
import ServicesSection from "@/components/services-section/ServicesSection";
import BenefitsSection from "./components/benefits/BenefitsSection";
import PricesSection from "./components/prices-section/PricesSection";
import Footer from "./components/footer/Footer";

export default function Home() {
  return (
    <div className="w-full p-0 overflow-hidden  bg-black">
      <HeroSection />
      <AnimatedSlider />
      <ServicesSection />
      <BenefitsSection />
      <PricesSection />
      <Footer />
    </div>
  );
}
