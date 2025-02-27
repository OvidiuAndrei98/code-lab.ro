import { useState } from "react";
import "./MobileNav.css";
import Image from "next/image";
import LogoWihte from "@/public/logo-white.svg";

const MobileNav = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleMenuClick = () => {
    const drawerInput = document.getElementById(
      "drawer-input"
    ) as HTMLInputElement;
    if (drawerInput) drawerInput.click();
  };

  return (
    <div className="header">
      <div className="overlay-blocker w-[72%] sm:w-[84%]"></div>
      <Image src={LogoWihte} alt="logo" width={100} />
      <input
        className="hidden"
        id="drawer-input"
        type="checkbox"
        checked={isMenuOpen}
        onClick={() => {
          setIsMenuOpen(!isMenuOpen);
        }}
      />
      <label
        htmlFor="drawer-input"
        className="drawer-open text-[12px] text-[#a0a0a0] hover:text-white"
      >
        <span></span>
      </label>
      <nav
        className={`nav-content backdrop-blur-xl ${
          isMenuOpen ? "" : "disabled"
        }`}
      >
        <ul className="items">
          <li
            className="item text-xl text-[#a0a0a0] hover:text-white"
            onClick={handleMenuClick}
          >
            <a href="#services">
              <p>001</p>
              <p>Services</p>
            </a>
          </li>
          <li
            className="item text-xl text-[#a0a0a0] hover:text-white"
            onClick={handleMenuClick}
          >
            <a href="#">
              <p>002</p>
              <p>Methodology</p>
            </a>
          </li>
          <li
            className="item text-xl text-[#a0a0a0] hover:text-white"
            onClick={handleMenuClick}
          >
            <a href="#">
              <p>003</p>
              <p>Benefits</p>
            </a>
          </li>
          <li
            className="item text-xl text-[#a0a0a0] hover:text-white"
            onClick={handleMenuClick}
          >
            <a href="#">
              <p>004</p>
              <p>Pricing</p>
            </a>
          </li>
          <li
            className="item text-xl text-[#a0a0a0] hover:text-white"
            onClick={handleMenuClick}
          >
            <a href="#">
              <p>005</p>
              <p>FAQ</p>
            </a>
          </li>
          <li
            className="item text-xl text-[#a0a0a0] hover:text-white"
            onClick={handleMenuClick}
          >
            <a href="#">
              <p>006</p>
              <p>Contact</p>
            </a>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default MobileNav;
