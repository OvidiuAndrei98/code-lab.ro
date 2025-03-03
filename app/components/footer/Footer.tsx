import React from "react";
import Image from "next/image";
import LogoWihte from "@/public/logo-white.svg";
import { InstagramLogoIcon } from "@radix-ui/react-icons";
import { Facebook, FacebookIcon, LucideFacebook } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const Footer: React.FC = () => {
  return (
    <footer className="text-white max-w-[1200px] mx-[auto] flex flex-col items-center py-[100px]">
      <div className="flex justify-between w-full">
        <Image src={LogoWihte} alt="logo" width={100} />
        <div className="space-x-5">
          <span>Services</span>
          <span>Methodology</span>
          <span>Benefits</span>
          <span>Pricing</span>
          <span>FAQ</span>
          <span>Contact</span>
        </div>
        <div className="flex items-center">
          <InstagramLogoIcon width={24} height={24} />
          <FacebookIcon width={20} height={20} />
        </div>
      </div>
      <Separator className="my-5" />
      <p>© 2025 Code Lab. All rights reserved.</p>
    </footer>
  );
};

export default Footer;
