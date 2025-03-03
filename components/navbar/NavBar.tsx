import { useEffect, useState } from "react";
import ShinyText from "../shiny-text/ShinyText";
import { Button } from "../ui/button";
import "./NavBar.css";
import LogoWihte from "@/public/logo-white.svg";
import Image from "next/image";

const NavBar = () => {
  const [hrefUrlAnchor, setHrefUrlAnchor] = useState("");

  useEffect(() => {
    const sections = document.querySelectorAll(".section");
    const navLi = document.querySelectorAll(".navbar ul li");

    window.addEventListener("scroll", () => {
      let current = "";

      sections.forEach((section) => {
        const sectionTop = (section as HTMLElement).offsetTop;
        if (pageYOffset >= sectionTop - 300) {
          const id = section.getAttribute("id");
          if (id) {
            current = id;
          }
        }
      });

      navLi.forEach((li) => {
        li.children[0].classList.remove("active");
        if (li.children[0].classList.contains(current)) {
          li.children[0].classList.add("active");
        }
      });
    });
  }, []);

  useEffect(() => {
    setHrefUrlAnchor(window.location.href.split("#")[1]);
    const activeElement = document.querySelector(`a[href="#${hrefUrlAnchor}"]`);
    if (activeElement) {
      activeElement.classList.add("active");
    }
  }, [hrefUrlAnchor]);

  return (
    <nav className="fixed top-0 w-full h-[70px] mt-4 px-[24px] z-[99]">
      <div className="navbar rounded-full h-full container mx-auto flex justify-between backdrop-blur-xl items-center p-[18px] ">
        <Image src={LogoWihte} alt="logo" width={100} />
        <ul className="flex w-full text-[#d2d2d2] text-2xl justify-between md:space-x-6 md:justify-center">
          <li className="flex-1 md:flex-none ">
            <a
              href="#services"
              className="services flex flex-col items-center gap-1 text-[var(--white-icon)] transition-colors text-xs md:text-base active"
            >
              <span className="text-[12px] text-[#a0a0a0] hover:text-white lg:text-[17px] font-light ">
                Services
              </span>
            </a>
          </li>
          <li className="flex-1 md:flex-none">
            <a
              href="#projects"
              className="flex flex-col items-center gap-1 text-[var(--white-icon)] transition-colors text-xs md:text-base"
            >
              <span className="text-[12px] lg:text-[17px] text-[#a0a0a0] hover:text-white font-light ">
                Methodology
              </span>
            </a>
          </li>
          <li className="flex-1 md:flex-none">
            <a
              href="#benefits"
              className="flex flex-col items-center gap-1 text-[var(--white-icon)] transition-colors text-xs md:text-base"
            >
              <span className="text-[12px] text-[#a0a0a0] hover:text-white lg:text-[17px] font-light ">
                Benefits
              </span>
            </a>
          </li>
          <li className="flex-1 md:flex-none">
            <a
              href="#prices"
              className="flex flex-col items-center gap-1 text-[var(--white-icon)] transition-colors text-xs md:text-base"
            >
              <span className="text-[12px] text-[#a0a0a0] hover:text-white lg:text-[17px] font-light ">
                Pricing
              </span>
            </a>
          </li>
          <li className="flex-1 md:flex-none">
            <a
              href="#projects"
              className="flex flex-col items-center gap-1 text-[var(--white-icon)] transition-colors text-xs md:text-base"
            >
              <span className="text-[12px] text-[#a0a0a0] hover:text-white lg:text-[17px] font-light ">
                FAQ
              </span>
            </a>
          </li>
          <li className="flex-1 md:flex-none">
            <a
              href="#contact"
              className="flex flex-col items-center gap-1 text-[var(--white-icon)] transition-colors text-xs md:text-base"
            >
              <span className="text-[12px] text-[#a0a0a0] hover:text-white lg:text-[17px] font-light ">
                Contact
              </span>
            </a>
          </li>
        </ul>
        <Button
          variant="ghost"
          className="navbar-button rounded-full font-light backdrop-blur-xl text-[#d2d2d2] border border-[#d2d2d2] hover:bg-[#d2d2d2] hover:text-black"
        >
          <ShinyText text="Contact" disabled={false} speed={3} />
        </Button>
      </div>
    </nav>
  );
};

export default NavBar;
