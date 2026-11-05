import type { Metadata } from "next";
import "@fontsource-variable/teko";
import "@fontsource-variable/dm-sans";
import "lenis/dist/lenis.css";
import { SiteShell } from "@/components/site-shell";
import { syncNativeScrollbar } from "@/lib/native-scrollbar";
import { installPageMotion } from "@/lib/page-motion";
import "./globals.css";
import "./studio-services.css";
import "./home-editorial.css";
import "./website-service.css";
import "./shop-service.css";
import "./app-service.css";
import "./studio-editorial.css";
import "./contact-editorial.css";
import "./animations.css";
import "./side-menu.css";
import "./menu-tab.css";

export const metadata: Metadata = {
  title: "CODELAB — Web design & development",
  description:
    "CODELAB este o agenție de web design și development. Construim website-uri de prezentare, magazine online și aplicații web, de la design până la lansare.",
  applicationName: "CODELAB",
  openGraph: {
    title: "CODELAB — Design & development",
    description:
      "Website-uri de prezentare, magazine online și aplicații web. Design și dezvoltare, în aceeași echipă.",
    locale: "ro_RO",
    type: "website",
  },
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ro" suppressHydrationWarning>
      <head>
        {/* Keep navigation opt-in available before external CSS and hydration. */}
        <style>{`html { scrollbar-gutter: stable; }
          @view-transition { navigation: auto; }
          @media (prefers-reduced-motion: reduce) {
            @view-transition { navigation: none; }
          }`}</style>
        {/* Choose native scrollbar styling before React or the first paint. */}
        <script
          id="native-scrollbar"
          dangerouslySetInnerHTML={{
            __html: `(${syncNativeScrollbar.toString()})();`,
          }}
        />
        <script
          id="page-motion"
          dangerouslySetInnerHTML={{
            __html: `(${installPageMotion.toString()})();`,
          }}
        />
      </head>
      <body>
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
