"use client";
import React, { useEffect, useState } from "react";
import NavBar from "./NavBar";
import MobileNav from "./MobileNav";

const NavigationMenu = () => {
  const [windowSize, setWindowSize] = useState<number>(0);

  useEffect(() => {
    if (typeof window != "undefined") {
      // Set initial value of window witth
      setWindowSize(window.innerWidth);

      window.addEventListener("resize", () => {
        setWindowSize(window.innerWidth);
      });
    }
  }, []);
  return <>{windowSize > 780 ? <NavBar /> : <MobileNav />}</>;
};

export default NavigationMenu;
