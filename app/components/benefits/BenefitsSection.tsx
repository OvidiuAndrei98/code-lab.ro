import Threads from "@/components/threads-animation/Threads";
import "./BenefitsSection.css";

const BenefitsSection = () => {
  return (
    <div
      id="benefits"
      className="section w-full flex flex-col justify-center mt-[100px] relative px-4"
    >
      <div className="max-w-[1200px] mx-[auto] w-full flex flex-col justify-center gap-4 max-w-[700px]">
        <span className="text-center text-xl text-[#C8C8C8] ">BENEFITS</span>
        <h1 className="text-center text-white text-4xl font-bold">
          Your Business, Amplified
        </h1>
        <h3 className="text-center text-white text-lg font-extralight">
          We provide a comprehensive suite of benefits, from streamlined project
          management and transparent communication to cutting-edge technology
          and ongoing support. See how we can elevate your online presence.
        </h3>
      </div>
      <div className="relative pb-4 grid grid-cols-2 gap-5 md:flex h-[400px] max-w-[1200px] mx-[auto] mt-10 ">
        <div className="benefit-card p-6 flex flex-col text-white gap-2 max-h-[200px] items-center justify-center rounded-lg border border-[#8b8b8b]">
          <span className="text-4xl font-bold">100%</span>
          <span className="text-[#C8C8C8] text-center">
            Modern technologies
          </span>
        </div>
        <div className="benefit-card p-6 flex flex-col text-white gap-2 max-h-[200px] items-center justify-center rounded-lg border border-[#8b8b8b]">
          <span className="text-4xl font-bold">100%</span>
          <span className="text-[#C8C8C8] text-center">
            Commitment to yout success
          </span>
        </div>
        <div className="benefit-card p-6 flex flex-col text-white gap-2 max-h-[200px] items-center justify-center rounded-lg border border-[#8b8b8b]">
          <span className="text-4xl font-bold">24/7</span>
          <span className="text-[#C8C8C8] text-center">Expert support</span>
        </div>
        <div className="benefit-card p-6 flex flex-col text-white gap-2 max-h-[200px] items-center justify-center rounded-lg border border-[#8b8b8b]">
          <span className="text-4xl font-bold">5x</span>
          <span className="text-[#C8C8C8] text-center">
            Modern technologies
          </span>
        </div>
      </div>
      <div className="absolute overflow-hidden w-[1000px] lg:w-full h-full opacity-[0.5] lg:opacity-[1]">
        <Threads
          amplitude={1.5}
          distance={1}
          enableMouseInteraction={false}
          color={[3, 0, 236]}
        />
      </div>
    </div>
  );
};

export default BenefitsSection;
