"use client";

import { useEffect } from "react";

// Favicon en app-icoon van de werkplek (huisstijl: Drive → Logo's →
// studiobaris-alle-logos → icon/). Bewust alleen op de werkplek-schermen en het
// inlogscherm: de previews voor prospects delen dezelfde root-layout en krijgen
// dit icoon dus niet. Daarom staat het ook niet als /favicon.ico in de root.
const LINKS = [
  { rel: "icon", href: "/werkplek/favicon.ico", sizes: "any" },
  { rel: "icon", href: "/werkplek/icon.svg", type: "image/svg+xml" },
  { rel: "apple-touch-icon", href: "/werkplek/apple-touch-icon.png" },
  { rel: "manifest", href: "/manifest.webmanifest" },
];

export default function WerkplekIcoon() {
  useEffect(() => {
    const gezet = LINKS.map((l) => {
      const el = document.createElement("link");
      Object.entries(l).forEach(([k, v]) => el.setAttribute(k, v));
      el.setAttribute("data-werkplek", "1");
      document.head.appendChild(el);
      return el;
    });
    const thema = document.createElement("meta");
    thema.name = "theme-color";
    thema.content = "#1A2B3D";
    document.head.appendChild(thema);
    return () => {
      gezet.forEach((el) => el.remove());
      thema.remove();
    };
  }, []);
  return null;
}
