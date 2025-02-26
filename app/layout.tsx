"use client";
import NavBar from "@/components/navbar/NavBar";
import "./globals.css";
import { useEffect, useState } from "react";
import MobileNav from "@/components/navbar/MobileNav";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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

  return (
    <html lang="en">
      <body>
        {windowSize > 780 ? <NavBar /> : <MobileNav />}

        {children}
      </body>
    </html>
  );
}
