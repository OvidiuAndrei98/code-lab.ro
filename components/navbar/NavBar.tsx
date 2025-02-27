import ShinyText from "../shiny-text/ShinyText";
import { Button } from "../ui/button";
import "./NavBar.css";

const NavBar = () => {
  return (
    <nav className="fixed top-0 w-full h-[70px] mt-4 px-[24px]">
      <div className="navbar rounded-full h-full container mx-auto flex justify-between backdrop-blur-xl items-center p-[18px] ">
        <span className="text-[20px] font-bold text-[#d2d2d2] text-nowrap">
          CODE-LAB
        </span>
        <ul className="flex w-full text-[#d2d2d2] text-2xl justify-between md:space-x-6 md:justify-center">
          <li className="flex-1 md:flex-none ">
            <a
              href="#home"
              className="flex flex-col items-center gap-1 text-[var(--white-icon)] transition-colors text-xs md:text-base active"
            >
              <span className="text-[12px] lg:text-[17px] font-light ">
                Home
              </span>
            </a>
          </li>
          <li className="flex-1 md:flex-none">
            <a
              href="#projects"
              className="flex flex-col items-center gap-1 text-[var(--white-icon)] transition-colors text-xs md:text-base"
            >
              <span className="text-[12px] lg:text-[17px] font-light ">
                Projects
              </span>
            </a>
          </li>
          <li className="flex-1 md:flex-none">
            <a
              href="#projects"
              className="flex flex-col items-center gap-1 text-[var(--white-icon)] transition-colors text-xs md:text-base"
            >
              <span className="text-[12px] lg:text-[17px] font-light ">
                Projects
              </span>
            </a>
          </li>
          <li className="flex-1 md:flex-none">
            <a
              href="#projects"
              className="flex flex-col items-center gap-1 text-[var(--white-icon)] transition-colors text-xs md:text-base"
            >
              <span className="text-[12px] lg:text-[17px] font-light ">
                Projects
              </span>
            </a>
          </li>
          <li className="flex-1 md:flex-none">
            <a
              href="#projects"
              className="flex flex-col items-center gap-1 text-[var(--white-icon)] transition-colors text-xs md:text-base"
            >
              <span className="text-[12px] lg:text-[17px] font-light ">
                Projects
              </span>
            </a>
          </li>
          <li className="flex-1 md:flex-none">
            <a
              href="#contact"
              className="flex flex-col items-center gap-1 text-[var(--white-icon)] transition-colors text-xs md:text-base"
            >
              <span className="text-[12px] lg:text-[17px] font-light ">
                Home
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
