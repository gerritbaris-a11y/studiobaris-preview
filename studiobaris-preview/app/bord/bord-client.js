"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { KLEUR } from "../werkplek-stijl";
import { Knop } from "../werkplek-shell";

const KOLOMMEN = [
  { key: "te_doen", label: "Te doen" },
  { key: "mee_bezig", label: "Mee bezig" },
  { key: "klaar", label: "Klaar" },
];

const PRIORITEIT = {
  laag: { label: "Laag", kleur: "#5E8C61", bg: "#E7EFE3" },
  normaal: { label: "Normaal", kleur: "#6B6258", bg: "#EFEAE0" },
  hoog: { label: "Hoog", kleur: "#9E3B2E", bg: "#F5E2D9" },
};

const kaart = { background: "#fff", border: `1px solid ${KLEUR.lijn}`, borderRadius: 14 };
const veldLabel = { display: "block", fontSize: 12.5, fontWeight: 700, color: KLEUR.labelDonker, marginBottom: 5 };
const veldInput = {
  width: "100%", boxSizing: "border-box", padding: "9px 11px", fontSize: 14.5,
  border: `1px solid ${KLEUR.lijn2}`, borderRadius: 8, fontFamily: "inherit",
};

function formatDeadline(d) {
  if (!d) return null;
  const dt = new Date(d + "T00:00:00");
  const vandaag = new Date(); vandaag.setHours(0, 0, 0, 0);
  const dagen = Math.round((dt - vandaag) / 86400000);
  const tekst = dt.toLocaleDateString("nl-NL", { day: "numeric", month: "short" });
  if (dagen < 0) return { tekst, kleur: "#b91c1c", label: `${tekst} (verlopen)` };
  if (dagen === 0) return { tekst, kleur: "#b45309", label: `${tekst} (vandaag)` };
  if (dagen <= 2) return { tekst, kleur: "#b45309", label: tekst };
  return { tekst, kleur: KLEUR.label, label: tekst };
}

function formatGrootte(bytes) {
  if (bytes === null || bytes === undefined) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function TaakModal({ taak, kolom, team, onSluit, onOpgeslagen }) {
  const [titel, setTitel] = useState(taak?.titel || "");
  const [omschrijving, setOmschrijving] = useState(taak?.omschrijving || "");
  const [toegewezenAanIds, setToegewezenAanIds] = useState(taak?.toegewezenen ? taak.toegewezenen.map((t) => t.id) : []);
  const [prioriteit, setPrioriteit] = useState(taak?.prioriteit || "normaal");
  const [deadline, setDeadline] = useState(taak?.deadline || "");
  const [bijlagen, setBijlagen] = useState(taak?.bijlagen || []);
  const [bijlageBezig, setBijlageBezig] = useState(false);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState("");

  async function opslaan() {
    if (!titel.trim()) return setFout("Vul een titel in.");
    setBezig(true); setFout("");
    try {
      const url = taak ? "/api/taken/bijwerken" : "/api/taken/aanmaken";
      const body = {
        ...(taak ? { id: taak.id } : { kolom: kolom || "te_doen" }),
        titel: titel.trim(),
        omschrijving: omschrijving.trim() || null,
        toegewezenAanIds,
        prioriteit,
        deadline: deadline || null,
      };
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Opslaan mislukt.");
      onOpgeslagen();
    } catch (e) {
      setFout(String(e.message || e));
    } finally {
      setBezig(false);
    }
  }

  async function verwijderen() {
    if (!taak) return;
    if (!confirm(`"${taak.titel}" verwijderen?`)) return;
    setBezig(true); setFout("");
    try {
      const res = await fetch("/api/taken/verwijderen", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: taak.id }) });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Verwijderen mislukt.");
      onOpgeslagen();
    } catch (e) {
      setFout(String(e.message || e));
    } finally {
      setBezig(false);
    }
  }

  async function bijlageUploaden(bestand) {
    if (!taak || !bestand) return;
    if (bestand.size > 26214400) {
      setFout(`"${bestand.name}" is te groot (max 25 MB).`);
      return;
    }
    setBijlageBezig(true); setFout("");
    try {
      const res1 = await fetch("/api/taken/bijlage-upload-url", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taakId: taak.id, bestandsnaam: bestand.name }),
      });
      const data1 = await res1.json();
      if (!res1.ok || !data1.ok) throw new Error(data1.error || "Uploaden voorbereiden mislukt.");

      const putRes = await fetch(data1.url, {
        method: "PUT",
        body: bestand,
        headers: { "Content-Type": bestand.type || "application/octet-stream" },
      });
      if (!putRes.ok) throw new Error("Uploaden naar opslag mislukt.");

      const res2 = await fetch("/api/taken/bijlage-bevestigen", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taakId: taak.id, pad: data1.pad, bestandsnaam: bestand.name,
          grootte: bestand.size, contentType: bestand.type || null,
        }),
      });
      const data2 = await res2.json();
      if (!res2.ok || !data2.ok) throw new Error(data2.error || "Opslaan van bijlage mislukt.");

      setBijlagen((prev) => [...prev, data2.bijlage]);
    } catch (e) {
      setFout(String(e.message || e));
    } finally {
      setBijlageBezig(false);
    }
  }

  async function bijlageVerwijderen(id) {
    if (!confirm("Deze bijlage verwijderen?")) return;
    setBijlageBezig(true); setFout("");
    try {
      const res = await fetch("/api/taken/bijlage-verwijderen", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Verwijderen mislukt.");
      setBijlagen((prev) => prev.filter((b) => b.id !== id));
    } catch (e) {
      setFout(String(e.message || e));
    } finally {
      setBijlageBezig(false);
    }
  }

  return (
    <div
      onClick={onSluit}
      style={{ position: "fixed", inset: 0, background: "rgba(43,39,36,.35)", display: "grid", placeItems: "center", zIndex: 50, padding: 16 }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ ...kaart, width: "100%", maxWidth: 460, padding: "20px 22px" }}>
        <h2 style={{ fontSize: 16, margin: "0 0 14px" }}>{taak ? "Taak bewerken" : "Nieuwe taak"}</h2>

        <label style={veldLabel}>Titel *</label>
        <input style={{ ...veldInput, marginBottom: 12 }} value={titel} onChange={(e) => setTitel(e.target.value)} autoFocus />

        <label style={veldLabel}>Omschrijving</label>
        <textarea
          style={{ ...veldInput, marginBottom: 12, minHeight: 70, resize: "vertical" }}
          value={omschrijving}
          onChange={(e) => setOmschrijving(e.target.value)}
        />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div>
            <label style={veldLabel}>Toegewezen aan</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 96, overflowY: "auto", border: `1px solid ${KLEUR.lijn2}`, borderRadius: 8, padding: "6px 8px", boxSizing: "border-box" }}>
              {team.map((t) => (
                <label key={t.id} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={toegewezenAanIds.includes(t.id)}
                    onChange={(e) => {
                      setToegewezenAanIds((prev) =>
                        e.target.checked ? [...prev, t.id] : prev.filter((id) => id !== t.id)
                      );
                    }}
                  />
                  {t.naam}
                </label>
              ))}
              {team.length === 0 && <span style={{ fontSize: 12.5, color: KLEUR.label }}>Geen teamleden gevonden.</span>}
            </div>
          </div>
          <div>
            <label style={veldLabel}>Prioriteit</label>
            <select style={veldInput} value={prioriteit} onChange={(e) => setPrioriteit(e.target.value)}>
              <option value="laag">Laag</option>
              <option value="normaal">Normaal</option>
              <option value="hoog">Hoog</option>
            </select>
          </div>
        </div>

        <label style={veldLabel}>Deadline</label>
        <input type="date" style={{ ...veldInput, marginBottom: 16 }} value={deadline} onChange={(e) => setDeadline(e.target.value)} />

        {taak && (
          <div style={{ marginBottom: 16 }}>
            <label style={veldLabel}>Bijlagen</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 8 }}>
              {bijlagen.map((b) => (
                <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                  <a
                    href={`/api/taken/bijlage-downloaden?id=${b.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: KLEUR.klei, fontWeight: 700, textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}
                  >
                    📎 {b.bestandsnaam}
                  </a>
                  <span style={{ fontSize: 11.5, color: KLEUR.label, flexShrink: 0 }}>{formatGrootte(b.grootte)}</span>
                  <button
                    type="button"
                    onClick={() => bijlageVerwijderen(b.id)}
                    disabled={bijlageBezig}
                    style={{ border: "none", background: "none", color: "#b91c1c", cursor: "pointer", fontSize: 12, flexShrink: 0 }}
                  >
                    Verwijderen
                  </button>
                </div>
              ))}
              {bijlagen.length === 0 && <span style={{ fontSize: 12.5, color: KLEUR.label }}>Nog geen bijlagen.</span>}
            </div>
            <input
              type="file"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) bijlageUploaden(f); e.target.value = ""; }}
              disabled={bijlageBezig}
              style={{ fontSize: 12.5 }}
            />
            {bijlageBezig && <div style={{ fontSize: 12, color: KLEUR.label, marginTop: 4 }}>Bezig…</div>}
          </div>
        )}

        {fout && <div style={{ color: "#b91c1c", fontSize: 13, marginBottom: 12 }}>{fout}</div>}

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Knop kind="primair" onClick={opslaan} disabled={bezig}>{bezig ? "Bezig…" : "Opslaan"}</Knop>
          <Knop kind="secondair" onClick={onSluit} disabled={bezig}>Annuleren</Knop>
          {taak && (
            <button
              type="button"
              onClick={verwijderen}
              disabled={bezig}
              style={{ marginLeft: "auto", background: "none", border: "none", color: "#b91c1c", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
            >
              Verwijderen
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function TaakKaart({ taak, onKlik, onSlepen, onVerplaats, isEerste, isLaatste }) {
  const deadline = formatDeadline(taak.deadline);
  const p = PRIORITEIT[taak.prioriteit] || PRIORITEIT.normaal;
  return (
    <div
      draggable
      onDragStart={(e) => { e.dataTransfer.setData("text/plain", taak.id); onSlepen(taak.id, taak.kolom); }}
      onClick={() => onKlik(taak)}
      style={{
        background: "#fff",
        border: `1px solid ${taak.prioriteit === "hoog" ? p.kleur : KLEUR.lijn2}`,
        borderLeft: taak.prioriteit === "hoog" ? `4px solid ${p.kleur}` : `1px solid ${KLEUR.lijn2}`,
        borderRadius: 10, padding: "11px 12px",
        marginBottom: 8, cursor: "grab",
        boxShadow: taak.prioriteit === "hoog" ? `0 1px 4px rgba(158,59,46,.18)` : "0 1px 2px rgba(43,39,36,.05)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: KLEUR.inkt, lineHeight: 1.3 }}>{taak.titel}</div>
        <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
          <button
            type="button"
            title="Naar boven"
            onClick={(e) => { e.stopPropagation(); onVerplaats(taak, -1); }}
            disabled={isEerste}
            style={{ border: "none", background: "none", cursor: isEerste ? "default" : "pointer", opacity: isEerste ? 0.25 : 0.6, fontSize: 12, padding: "0 2px" }}
          >▲</button>
          <button
            type="button"
            title="Naar beneden"
            onClick={(e) => { e.stopPropagation(); onVerplaats(taak, 1); }}
            disabled={isLaatste}
            style={{ border: "none", background: "none", cursor: isLaatste ? "default" : "pointer", opacity: isLaatste ? 0.25 : 0.6, fontSize: 12, padding: "0 2px" }}
          >▼</button>
        </div>
      </div>
      {taak.omschrijving && (
        <div style={{ fontSize: 12.5, color: KLEUR.gedempt, marginBottom: 8, lineHeight: 1.4 }}>{taak.omschrijving}</div>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
        <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999, color: p.kleur, background: p.bg }}>{taak.prioriteit === "hoog" ? "⚠ " : ""}{p.label}</span>
        {deadline && (
          <span style={{ fontSize: 11.5, fontWeight: 700, color: deadline.kleur }}>{deadline.label}</span>
        )}
        {taak.bijlagen && taak.bijlagen.length > 0 && (
          <span style={{ fontSize: 11.5, color: KLEUR.label }} title={`${taak.bijlagen.length} bijlage(n)`}>
            📎 {taak.bijlagen.length}
          </span>
        )}
        {taak.toegewezenen && taak.toegewezenen.length > 0 && (
          <span style={{ marginLeft: "auto", display: "flex", gap: 3 }}>
            {taak.toegewezenen.map((p) => (
              <span
                key={p.id}
                title={p.naam}
                style={{ fontSize: 11, fontWeight: 700, color: "#fff", background: KLEUR.klei, borderRadius: 999, width: 22, height: 22, display: "grid", placeItems: "center" }}
              >
                {p.naam.charAt(0).toUpperCase()}
              </span>
            ))}
          </span>
        )}
      </div>
    </div>
  );
}

export default function BordClient({ taken, team, ingelogdAls }) {
  const router = useRouter();
  const [lijst, setLijst] = useState(taken);
  const [modalTaak, setModalTaak] = useState(null);
  const [nieuweTaakVoor, setNieuweTaakVoor] = useState(null);
  const [fout, setFout] = useState("");
  const slepend = useRef(null); // { id, vanKolom }

  useEffect(() => { setLijst(taken); }, [taken]);

  function opnieuwLaden() {
    setModalTaak(null); setNieuweTaakVoor(null);
    router.refresh();
  }

  const perKolom = (kolom) => lijst.filter((t) => t.kolom === kolom).sort((a, b) => a.volgorde - b.volgorde);

  async function verplaatsNaarKolom(kolom, taakIds) {
    setLijst((prev) => {
      const gezet = new Set(taakIds);
      const rest = prev.filter((t) => !gezet.has(t.id) || t.kolom !== kolom);
      const nieuw = prev
        .filter((t) => gezet.has(t.id))
        .map((t) => ({ ...t, kolom }));
      const geordend = taakIds.map((id) => nieuw.find((t) => t.id === id)).filter(Boolean);
      return [...rest.filter((t) => !gezet.has(t.id)), ...geordend];
    });
    try {
      const res = await fetch("/api/taken/verplaatsen", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kolom, taakIds }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Verplaatsen mislukt.");
    } catch (e) {
      setFout(String(e.message || e));
      router.refresh();
    }
  }

  function onDropInKolom(kolom) {
    const info = slepend.current;
    slepend.current = null;
    if (!info) return;
    const huidigeIds = perKolom(kolom).map((t) => t.id).filter((id) => id !== info.id);
    // Verplaatsen tussen kolommen: aan het eind toevoegen. Fijner herordenen
    // binnen een kolom doe je met de ▲/▼-knoppen op het kaartje.
    verplaatsNaarKolom(kolom, [...huidigeIds, info.id]);
  }

  function verplaatsBinnenKolom(taak, richting) {
    const ids = perKolom(taak.kolom).map((t) => t.id);
    const idx = ids.indexOf(taak.id);
    const nieuwIdx = idx + richting;
    if (nieuwIdx < 0 || nieuwIdx >= ids.length) return;
    [ids[idx], ids[nieuwIdx]] = [ids[nieuwIdx], ids[idx]];
    verplaatsNaarKolom(taak.kolom, ids);
  }

  return (
    <div>
      {fout && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontSize: 13.5 }}>
          {fout}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14, alignItems: "start" }}>
        {KOLOMMEN.map((k) => {
          const items = perKolom(k.key);
          return (
            <div
              key={k.key}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); onDropInKolom(k.key); }}
              style={{ ...kaart, background: KLEUR.baan, padding: "12px 12px 14px", minHeight: 160 }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, padding: "0 2px" }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: KLEUR.inkt, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  {k.label} <span style={{ color: KLEUR.label, fontWeight: 600 }}>({items.length})</span>
                </div>
              </div>

              {items.map((taak, i) => (
                <TaakKaart
                  key={taak.id}
                  taak={taak}
                  onKlik={setModalTaak}
                  onSlepen={(id, vanKolom) => { slepend.current = { id, vanKolom }; }}
                  onVerplaats={verplaatsBinnenKolom}
                  isEerste={i === 0}
                  isLaatste={i === items.length - 1}
                />
              ))}
              {items.length === 0 && (
                <div style={{ fontSize: 12.5, color: KLEUR.label, padding: "8px 2px" }}>Sleep hier een kaartje naartoe, of maak er een aan.</div>
              )}

              <button
                type="button"
                onClick={() => setNieuweTaakVoor(k.key)}
                style={{
                  width: "100%", marginTop: 6, padding: "8px 10px", borderRadius: 8, border: `1px dashed ${KLEUR.lijn2}`,
                  background: "transparent", color: KLEUR.labelDonker, fontSize: 13, fontWeight: 700, cursor: "pointer",
                }}
              >
                + Taak toevoegen
              </button>
            </div>
          );
        })}
      </div>

      {modalTaak && (
        <TaakModal taak={modalTaak} team={team} onSluit={() => setModalTaak(null)} onOpgeslagen={opnieuwLaden} />
      )}
      {nieuweTaakVoor && (
        <TaakModal taak={null} kolom={nieuweTaakVoor} team={team} onSluit={() => setNieuweTaakVoor(null)} onOpgeslagen={opnieuwLaden} />
      )}
    </div>
  );
}
