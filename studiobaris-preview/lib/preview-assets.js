// Standaard niche-foto's (Unsplash, gratis) en inhoud-passende iconen voor de preview.
// Echte foto's van de klant gaan altijd vóór; dit is de terugval.

const IMG_W = 1000;
const IMG_Q = 68;
const u = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${IMG_W}&q=${IMG_Q}`;

const SETS = {
  dakdekker: ["photo-1635424824849-1b09bdcc55b1", "photo-1635424709845-3a85ad5e1f5e", "photo-1518736346281-76873166a64a", "photo-1633759593085-1eaeb724fc88", "photo-1726589004565-bedfba94d3a2"],
  schilder: ["photo-1525909002-1b05e0c869d8", "photo-1717281234297-3def5ae3eee1", "photo-1688372199140-cade7ae820fe", "photo-1693985120993-e9b203ce7631", "photo-1574359411659-15573a27fd0c"],
  hovenier: ["photo-1597201278257-3687be27d954", "photo-1621272156568-7306716648df", "photo-1668120089662-42642838cfef", "photo-1700689807667-82630348b301", "photo-1632161293871-cf2083474e34"],
  loodgieter: ["photo-1676210133055-eab6ef033ce3", "photo-1607472586893-edb57bdc0e39", "photo-1538474705339-e87de81450e8", "photo-1545193329-4a052e14eb8f", "photo-1650551182991-b07558247564"],
  timmerman: ["photo-1659930087003-2d64e33181f7", "photo-1544164560-adac3045edb2", "photo-1611021061285-16c871740efa", "photo-1561297331-a9c00b9c2c44", "photo-1608613304899-ea8098577e38"],
  stukadoor: ["photo-1533738630286-f1f4a61705f8", "photo-1478109562701-8d261b58b09d", "photo-1543525324-26e03b510586", "photo-1723176446437-cb8b5e51a492", "photo-1559173525-d16dfd7c17fe"],
  tegelzetter: ["photo-1548967199-79324abbe7dc", "photo-1541471943749-e5976783f6c3", "photo-1458682625221-3a45f8a844c7", "photo-1647102256335-7a7370d99924", "photo-1547414857-c9f61632b250"],
  metselaar: ["photo-1559322575-2f4e66131d55", "photo-1704005445445-2747074be8ac", "photo-1609433126729-535bd3e0b4f6", "photo-1665242052534-3593b241d4e4", "photo-1629608564457-5d74829a9e14"],
  elektricien: ["photo-1682345262055-8f95f3c513ea", "photo-1621905251189-08b45d6a269e", "photo-1635335874521-7987db781153", "photo-1544724569-5f546fd6f2b5", "photo-1581972327480-e3764d31e5e6"],
  glazenzetter: ["photo-1527352774566-e4916e36c645", "photo-1531383339897-f369f6422e40", "photo-1630368177606-471ad5e501c4", "photo-1572739275114-ec3764ba1477", "photo-1600077349654-dafee19be957"],
  aannemer: ["photo-1593786267440-550458cc882a", "photo-1612935089040-89195ef54677", "photo-1593012671976-1422185230fb", "photo-1601303981778-0f61e3d2da64", "photo-1683372101362-2efc3e75650e"],
  schoonmaak: ["photo-1740657254989-42fe9c3b8cce", "photo-1647381518264-97ff1835026f", "photo-1713110824336-f78c320dcf8e", "photo-1581578949510-fa7315c4c350", "photo-1758523670739-0d26a3ee976d"],
  generiek: ["photo-1517581177682-a085bb7ffb15", "photo-1618832515490-e181c4794a45", "photo-1505798577917-a65157d3320a", "photo-1634586648651-f1fb9ec10d90", "photo-1610459716431-e07abcf74230"],
};

function nicheKey(branche) {
  const b = String(branche || "").toLowerCase();
  if (b.includes("dak")) return "dakdekker";
  if (b.includes("schilder") || b.includes("behang")) return "schilder";
  if (b.includes("hovenier") || b.includes("tuin")) return "hovenier";
  if (b.includes("loodgiet") || b.includes("sanitair") || b.includes("installat")) return "loodgieter";
  if (b.includes("timmer")) return "timmerman";
  if (b.includes("stukad")) return "stukadoor";
  if (b.includes("tegel")) return "tegelzetter";
  if (b.includes("metsel") || b.includes("voeg")) return "metselaar";
  if (b.includes("elektr")) return "elektricien";
  if (b.includes("glas") || b.includes("glaz") || b.includes("raam") || b.includes("kozijn")) return "glazenzetter";
  if (b.includes("schoonmaak") || b.includes("schoonma") || b.includes("cleaning") || b.includes("reinig")) return "schoonmaak";
  if (b.includes("aannem") || b.includes("bouwbedr") || b.includes("verbouw") || b.includes("renovat") || b.includes("klus")) return "aannemer";
  return "generiek";
}

// Geeft een niche-passende foto-URL terug (index zorgt voor afwisseling per blok).
export function nicheFoto(branche, i = 0) {
  const set = SETS[nicheKey(branche)] || SETS.generiek;
  return u(set[Math.abs(i) % set.length]);
}

// Inhoud-passend icoon voor de "wat u krijgt"-blokken, op basis van titel/tekst.
function svg(children) {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
  );
}

export function voordeelIcon(titel, tekst) {
  const t = (String(titel || "") + " " + String(tekst || "")).toLowerCase();
  if (/snel|tijd|reactie|bereikbaar|spoed|direct|binnen/.test(t)) {
    return svg(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></>); // klok
  }
  if (/eerlijk|transparant|duidelijk|advies|vertrouwen|geen verrass|tevreden|open/.test(t)) {
    return svg(<><path d="M7 10v10H4V10z" /><path d="M7 10l3.4-6.4A1.5 1.5 0 0 1 13 4.2V9h5.4a1.7 1.7 0 0 1 1.7 2l-1 6.4A2 2 0 0 1 17.1 20H7" /></>); // duim omhoog
  }
  if (/netjes|schoon|zorg|detail|afwerk|nauwkeur|precis|verzorgd/.test(t)) {
    return svg(<><path d="M12 3l1.7 4.4L18 9l-4.3 1.6L12 15l-1.7-4.4L6 9l4.3-1.6z" /><path d="M18.5 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" /></>); // sparkles
  }
  if (/persoonlijk|contact|klant|samen|mens|aanspreek/.test(t)) {
    return svg(<><circle cx="12" cy="8" r="4" /><path d="M4 20c0-3.6 3.6-5.6 8-5.6s8 2 8 5.6" /></>); // persoon
  }
  if (/kwaliteit|vakmanschap|vakwerk|ambacht|passie|ervaring|jaren|expert|specialist|trots/.test(t)) {
    return svg(<><circle cx="12" cy="8" r="5" /><path d="M8.5 12.5 7 21l5-3 5 3-1.5-8.5" /></>); // medaille
  }
  // betrouwbaar / garantie / zeker / afspraak / veilig / duurzaam / default
  return svg(<><path d="M12 3l7 3v5c0 4.6-3.1 7.6-7 9-3.9-1.4-7-4.4-7-9V6l7-3z" /><path d="M9 12l2 2 4-4" /></>); // schild-check
}
