import "./globals.css";
import WerkplekChrome from "./werkplek-chrome";

// Favicon StudioBaris (Drive → Logo's → studiobaris-alle-logos → icon/), op alle
// pagina's: werkplek, previews (preview.studiobaris.nl/<slug>), aanbod, akkoord
// (betalen.studiobaris.nl) en de gegevenspagina na akkoord. Pagina's met eigen
// generateMetadata erven deze icons zolang ze zelf geen icons zetten.
export const metadata = {
  title: "StudioBaris",
  description: "Website preview",
  icons: {
    icon: [
      { url: "/werkplek/favicon.ico", sizes: "any" },
      { url: "/werkplek/icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/werkplek/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="nl">
      <body>
        {children}
        <WerkplekChrome />
      </body>
    </html>
  );
}
