import { Button } from "../ui/button";
import "./MobileNav.css";

const MobileNav = () => {
  return (
    <nav className="fixed top-0 w-full  h-[70px] mt-4 px-4">
      <div className="navbar rounded-full h-full container mx-auto flex justify-between backdrop-blur-xl w-full items-center p-[18px]">
        <span className="text-[20px] font-bold text-[#d2d2d2] text-nowrap">
          CODE-LAB
        </span>

        <span>menu</span>
      </div>
    </nav>
  );
};

export default MobileNav;
