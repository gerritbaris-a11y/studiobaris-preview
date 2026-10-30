"use client";

import { useEffect } from "react";

// Meldt de hoogte van de pagina aan de klantsite (iframe van [sb-agenda]),
// zodat de agenda daar meegroeit zonder eigen scrollbalk.
export default function Hoogte() {
  useEffect(() => {
    if (window.parent === window) return;
    const stuur = () => window.parent.postMessage({ type: "sb-agenda-hoogte", hoogte: document.documentElement.scrollHeight }, "*");
    const ro = new ResizeObserver(stuur);
    ro.observe(document.body);
    stuur();
    return () => ro.disconnect();
  }, []);
  return null;
}
