import "./globals.css";
import type { Metadata } from "next";
import NavigationMenu from "@/components/navbar/NavigationMenu";
import Footer from "./components/footer/Footer";

export const metadata: Metadata = {
  generator: "Next.js",
  applicationName: "code-lab.ro",
  referrer: "origin-when-cross-origin",
  publisher: "code-lab.ro",
  title: {
    absolute: "Codelab",
  },
  description: "",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-black">
        <NavigationMenu />
        {children}
        <Footer />
      </body>
    </html>
  );
}
