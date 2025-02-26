import "./NavBar.css";

const NavBar = () => {
  return (
    <nav className="fixed top-0 w-full pl-[150px] pr-[150px] h-[70px] mt-4">
      <div className="navbar rounded-full h-full container mx-auto flex justify-between backdrop-blur-xl w-full items-center p-6">
        <span className="text-[17px] font-light text-[#d2d2d2]">Cl</span>
        <ul className="flex w-full text-[#d2d2d2] text-2xl justify-between md:space-x-6 md:justify-center  gap-3">
          <li className="flex-1 md:flex-none ">
            <a
              href="#home"
              className="flex flex-col items-center gap-1 text-[var(--white-icon)] transition-colors text-xs md:text-base active"
            >
              <span className="text-[16px] font-light ">Home</span>
            </a>
          </li>
          <li className="flex-1 md:flex-none">
            <a
              href="#projects"
              className="flex flex-col items-center gap-1 text-[var(--white-icon)] transition-colors text-xs md:text-base"
            >
              <span className="text-[16px] font-light ">Projects</span>
            </a>
          </li>
          <li className="flex-1 md:flex-none">
            <a
              href="#projects"
              className="flex flex-col items-center gap-1 text-[var(--white-icon)] transition-colors text-xs md:text-base"
            >
              <span className="text-[16px] font-light ">Projects</span>
            </a>
          </li>
          <li className="flex-1 md:flex-none">
            <a
              href="#projects"
              className="flex flex-col items-center gap-1 text-[var(--white-icon)] transition-colors text-xs md:text-base"
            >
              <span className="text-[16px] font-light ">Projects</span>
            </a>
          </li>
          <li className="flex-1 md:flex-none">
            <a
              href="#projects"
              className="flex flex-col items-center gap-1 text-[var(--white-icon)] transition-colors text-xs md:text-base"
            >
              <span className="text-[16px] font-light ">Projects</span>
            </a>
          </li>
          <li className="flex-1 md:flex-none">
            <a
              href="#contact"
              className="flex flex-col items-center gap-1 text-[var(--white-icon)] transition-colors text-xs md:text-base"
            >
              <span className="text-[16px] font-light ">Home</span>
            </a>
          </li>
        </ul>
        <div>LOGO</div>
      </div>
    </nav>
  );
};

export default NavBar;
