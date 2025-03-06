import TiltedCard from "@/components/title-card/TitleCard";
import React from "react";
import MethodologyImage from "../../../public/banner-landing-page-service.jpg";

const Methodology: React.FC = () => {
  return (
    <div className="max-w-[1200px] mx-[auto] pt-[100px]  relative p-4">
      <div className="max-w-[1200px] mx-[auto] w-full flex flex-col justify-center gap-4 max-w-[700px] pb-12">
        <span className="text-center text-xl text-[#C8C8C8] ">Methodology</span>
        <h1 className="text-center text-white text-4xl font-bold">
          Transforming your ideas into stunning results
        </h1>
        <h3 className="text-center text-white text-lg font-extralight">
          Our methodology is designed to take your ideas from concept to reality
          with precision and creativity. By combining in-depth research,
          innovative design techniques, and cutting-edge technology, we ensure
          every project is tailored to meet your unique goals.
        </h3>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3  lg:grid-rows-[200px_200px_300px] gap-4 text-white ">
        <div className="col-span-1 row-span-1 row-start-2 xl:row-start-1 text-center max-w-[700px] mx-[auto]">
          <div className="p-8 bg-[#7231EC] inline-flex items-center justify-center rounded-full w-[50px] h-[50px] mb-4">
            1
          </div>
          <h1 className="text-center text-white text-4xl font-bold">
            Discovery & Strategy
          </h1>
          <h3 className="text-center text-white text-md font-extralight">
            We begin by understanding your business, goals, and target audience.
            Through in-depth consultations and market research, we identify the
            unique needs of your project.
          </h3>
        </div>
        <div className="col-span-1 row-span-1 col-start-1 row-start-4 xl:col-start-3 xl:row-start-1 text-center max-w-[700px] mx-[auto]">
          <div className="p-8 bg-[#7231EC] inline-flex items-center justify-center rounded-full w-[50px] h-[50px] mb-4">
            3
          </div>
          <h1 className="text-center text-white text-4xl font-bold">
            Implementation
          </h1>
          <h3 className="text-center text-white text-md font-extralight">
            We transform the prototype into a fully responsive, SEO-friendly
            website. We integrate essential features and functionalities.
          </h3>
        </div>
        <div className="col-span-1 row-span-1 row-start-3 xl:col-start-1 xl:row-start-3 text-center max-w-[700px] mx-[auto]">
          <div className="p-8 bg-[#7231EC] inline-flex items-center justify-center rounded-full w-[50px] h-[50px] mb-4">
            2
          </div>
          <h1 className="text-center text-white text-4xl font-bold">
            Design & Prototyping
          </h1>
          <h3 className="text-center text-white text-md font-extralight">
            We create pixel-perfect prototypes that reflect your brand&apos;s
            identity. We focus on user experience and user interface design to
            ensure your website is intuitive and engaging.
          </h3>
        </div>
        <div className="col-span-1 row-span-1 col-start-1 row-start-5 xl:col-start-3 xl:row-start-3 text-center max-w-[700px] mx-[auto]">
          <div className="p-8 bg-[#7231EC] inline-flex items-center justify-center rounded-full w-[50px] h-[50px] mb-4">
            4
          </div>
          <h1 className="text-center text-white text-4xl font-bold">
            Delivery & Optimisation
          </h1>
          <h3 className="text-center text-white text-md font-extralight">
            We optimize page load speeds, fine-tune SEO elements, and make sure
            all features are functioning correctly. After launch we provide
            ongoing support and maintenance to ensure your website is working
            properly.
          </h3>
        </div>
        <div className="col-span-1 row-span-1 col-start-1 row-start-1 xl:col-start-2 xl:row-start-2 text-center max-w-[700px] mx-[auto]">
          <TiltedCard
            imageSrc={MethodologyImage.src}
            scaleOnHover={1.05}
            showMobileWarning={false}
            imageHeight={300}
            imageWidth={300}
          />
        </div>
      </div>
    </div>
  );
};

export default Methodology;
