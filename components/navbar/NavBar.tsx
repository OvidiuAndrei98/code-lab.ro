import { forwardRef, useEffect, useState } from "react";
import ShinyText from "../shiny-text/ShinyText";
import { Button } from "../ui/button";
import "./NavBar.css";
import LogoWihte from "@/public/logo-white.svg";
import Image from "next/image";
import { redirect } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

const components: { title: string; href: string; description: string }[] = [
  {
    title: "Landing Page",
    href: "/servicii/landing-page",
    description: "Description",
  },
  {
    title: "Website",
    href: "/servicii/website",
    description: "Description",
  },
  {
    title: "Online shop",
    href: "/servicii/magazin-online",
    description: "Description",
  },
  {
    title: "Web application",
    href: "/",
    description: "Description",
  },
];

const NavBar = () => {
  const [hrefUrlAnchor, setHrefUrlAnchor] = useState("");

  useEffect(() => {
    const sections = document.querySelectorAll(".section");
    const navLi = document.querySelectorAll("nav ul li");

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
        li.classList.remove("active");
        if (li.classList.contains(current)) {
          li.classList.add("active");
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
        <Image
          src={LogoWihte}
          alt="logo"
          width={100}
          onClick={() => redirect("/")}
          className="cursor-pointer"
        />
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem
              className="services"
              onClick={() => redirect("/#services")}
            >
              <NavigationMenuTrigger>Services</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                  {components.map((component) => (
                    <ListItem
                      key={component.title}
                      title={component.title}
                      href={component.href}
                    >
                      {component.description}
                    </ListItem>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem className="methodology">
              <Link href="#" legacyBehavior passHref>
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  Methodology
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem className="benefits">
              <Link href="/#benefits" legacyBehavior passHref>
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  Benefits
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem className="prices">
              <Link href="/#prices" legacyBehavior passHref>
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  Prices
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem className="faq">
              <Link href="/#" legacyBehavior passHref>
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  FAQ
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
        <Button
          variant="ghost"
          className="navbar-button rounded-full font-light backdrop-blur-xl text-[#d2d2d2] border border-[#d2d2d2] hover:bg-[#d2d2d2] hover:text-black"
          onClick={() => redirect("#contact")}
        >
          <ShinyText text="Contact" disabled={false} speed={3} />
        </Button>
      </div>
    </nav>
  );
};

export default NavBar;

const ListItem = forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-[#68686833] hover:text-white focus:bg-[#68686833] focus:text-white",
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-[#a0a0a0]">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = "ListItem";
