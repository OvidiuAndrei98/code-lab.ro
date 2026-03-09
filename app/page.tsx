import AnimatedSlider from "@/components/animated-slider/AnimatedSlider";
import HeroSection from "@/components/hero-section/HeroSection";
import ServicesSection from "@/components/services-section/ServicesSection";
import BenefitsSection from "./components/benefits/BenefitsSection";
import PricesSection from "./components/prices-section/PricesSection";
import Contact from "./components/contact/Contact";
import Methodology from "./components/methodology/Methodology";

export default function Home() {
  return (
    <div className="w-full p-0 overflow-hidden bg-black">
      <HeroSection />
      <AnimatedSlider />
      <ServicesSection />
      <Methodology />
      <BenefitsSection />
      <PricesSection />
      <Contact />
    </div>
  );
}
