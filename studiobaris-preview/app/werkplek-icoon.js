"use client";

import { useEffect } from "react";

// Installeerbare werkplek (manifest + themakleur), alleen op de werkplek-schermen
// en het inlogscherm. Het favicon zelf staat sinds 28 okt in app/layout.js, zodat
// ook previews, aanbod-, akkoord- en gegevenspagina het StudioBaris-icoon tonen.
const LINKS = [
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
