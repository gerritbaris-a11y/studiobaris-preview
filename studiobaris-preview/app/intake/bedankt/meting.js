"use client";

import { useEffect } from "react";
import { meldPreviewAanvraag } from "../../../lib/statistiek";

// Meldt de aanvraag aan GA4 zodra de bedanktpagina opent. Doet niets zonder
// toestemming voor statistieken (zie lib/statistiek.js).
export default function BedanktMeting() {
  useEffect(() => { meldPreviewAanvraag(); }, []);
  return null;
}
