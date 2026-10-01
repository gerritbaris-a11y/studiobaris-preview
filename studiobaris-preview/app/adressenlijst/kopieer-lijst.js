"use client";

import { useState } from "react";
import { Knop } from "../werkplek-shell";

// Kopieert de lijst met tabs ertussen, zodat hij zo in Excel/Sheets of een
// etiketten-sjabloon geplakt kan worden (bedrijf, telefoon, adres).
export default function KopieerLijst({ rijen }) {
  const [status, setStatus] = useState("idle");

  async function kopieer() {
    const tekst = ["Bedrijf\tTelefoon\tAdres"]
      .concat(rijen.map((r) => [r.bedrijf, r.telefoon, r.adres].map((v) => String(v || "").replace(/\s+/g, " ").trim()).join("\t")))
      .join("\n");
    try {
      await navigator.clipboard.writeText(tekst);
      setStatus("ok");
    } catch {
      setStatus("fout");
    }
    setTimeout(() => setStatus("idle"), 1800);
  }

  return (
    <Knop onClick={kopieer} kind="secondair">
      {status === "ok" ? "Gekopieerd!" : status === "fout" ? "Kopiëren mislukt" : "Lijst kopiëren"}
    </Knop>
  );
}
