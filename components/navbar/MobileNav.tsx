import { useState } from "react";
import "./MobileNav.css";
import Image from "next/image";
import LogoWihte from "@/public/logo-white.svg";
import Link from "next/link";
import { redirect } from "next/navigation";

const MobileNav = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [servicesSubMenuOpen, setServicesSubMenuOpen] = useState(false);

  const handleMenuClick = (routeName?: string) => {
    if (routeName === "services") {
      setServicesSubMenuOpen(!servicesSubMenuOpen);
      return;
    }
    const drawerInput = document.getElementById(
      "drawer-input"
    ) as HTMLInputElement;
    if (drawerInput) drawerInput.click();
    setServicesSubMenuOpen(false);
  };

  return (
    <div className="header">
      <Image
        src={LogoWihte}
        alt="logo"
        className="pointer-events-auto"
        width={100}
        onClick={() => redirect("/")}
      />
      <input
        className="hidden"
        id="drawer-input"
        type="checkbox"
        defaultChecked={isMenuOpen}
        onClick={() => {
          setServicesSubMenuOpen(false);
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
        className={`nav-content backdrop-blur-xl  ${
          isMenuOpen ? "" : "disabled"
        }`}
      >
        <ul className="items">
          <li className="item text-xl text-[#a0a0a0] hover:text-white">
            <a onClick={() => handleMenuClick("services")}>
              <p>001</p>
              <p>Services</p>
            </a>
            <ul
              className={`px-8 py-4 transition-all ${
                servicesSubMenuOpen ? "block" : "hidden"
              }`}
            >
              <li className="item text-xl text-[#a0a0a0] hover:text-white">
                <a href="/servicii/landing-page">Landing page</a>
              </li>
              <li className="item text-xl text-[#a0a0a0] hover:text-white">
                <a href="/servicii/website">Website</a>
              </li>
              <li className="item text-xl text-[#a0a0a0] hover:text-white">
                <a href="/servicii/magazin-online">Online shop</a>
              </li>
              <li className="item text-xl text-[#a0a0a0] hover:text-white">
                <Link href="/">Web application</Link>
              </li>
            </ul>
          </li>

          <li
            className="item text-xl text-[#a0a0a0] hover:text-white"
            onClick={() => handleMenuClick()}
          >
            <Link href="/">
              <p>002</p>
              <p>Methodology</p>
            </Link>
          </li>
          <li
            className="item text-xl text-[#a0a0a0] hover:text-white"
            onClick={() => handleMenuClick()}
          >
            <Link href="/#benefits">
              <p>003</p>
              <p>Benefits</p>
            </Link>
          </li>
          <li
            className="item text-xl text-[#a0a0a0] hover:text-white"
            onClick={() => handleMenuClick()}
          >
            <Link href="/#prices">
              <p>004</p>
              <p>Pricing</p>
            </Link>
          </li>
          <li
            className="item text-xl text-[#a0a0a0] hover:text-white"
            onClick={() => handleMenuClick()}
          >
            <Link href="/">
              <p>005</p>
              <p>FAQ</p>
            </Link>
          </li>
          <li
            className="item text-xl text-[#a0a0a0] hover:text-white"
            onClick={() => handleMenuClick()}
          >
            <Link href="/#contact">
              <p>006</p>
              <p>Contact</p>
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default MobileNav;
