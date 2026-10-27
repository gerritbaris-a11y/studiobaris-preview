"use client";

import { useState } from "react";
import WerkplekIcoon from "../werkplek-icoon";

export default function LoginForm({ team = [] }) {
  const [gekozen, setGekozen] = useState(null); // { id, naam, rol, gezet }
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [fout, setFout] = useState("");
  const [bezig, setBezig] = useState(false);

  const beheer = team.filter((t) => t.rol === "beheer");
  const verkopers = team.filter((t) => t.rol !== "beheer");

  async function login(e) {
    e.preventDefault();
    setFout("");
    if (!gekozen) return;
    if (!pw) return setFout("Vul je wachtwoord in.");
    if (!gekozen.gezet) {
      if (pw.length < 6) return setFout("Kies een wachtwoord van minstens 6 tekens.");
      if (pw !== pw2) return setFout("De twee wachtwoorden zijn niet gelijk.");
    }
    setBezig(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ naam: gekozen.naam, wachtwoord: pw }),
      });
      const d = await res.json();
      if (!d.ok) {
        setFout(d.error || "Inloggen mislukt.");
        setBezig(false);
        return;
      }
      const params = new URLSearchParams(window.location.search);
      let next = params.get("next");
      if (!next || next === "/login") {
        next = "/klanten";
      }
      window.location.href = next;
    } catch (err) {
      setFout(String(err));
      setBezig(false);
    }
  }

  const wrap = {
    minHeight: "100vh", background: "#1A2B3D", display: "flex", alignItems: "center",
    justifyContent: "center", padding: 16, fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
  };
  const card = {
    background: "#fff", borderRadius: 18, padding: "26px 22px", width: "100%",
    maxWidth: 400, boxShadow: "0 20px 60px -20px rgba(0,0,0,.5)",
  };
  const naamBtn = (actief) => ({
    display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left",
    padding: "12px 14px", marginBottom: 8, borderRadius: 11, cursor: "pointer",
    border: "1.5px solid " + (actief ? "#C79A56" : "#E3DED3"),
    background: actief ? "#F7F4EE" : "#fff", fontSize: 15.5, fontWeight: 600, color: "#1A2B3D",
  });
  const inp = {
    width: "100%", padding: "12px 13px", border: "1.5px solid #d8dde3", borderRadius: 11,
    fontSize: 16, marginTop: 8, boxSizing: "border-box",
  };
  const bol = (kleur) => ({
    width: 30, height: 30, borderRadius: 9, background: kleur, color: "#fff",
    display: "grid", placeItems: "center", fontWeight: 800, fontSize: 14, flex: "0 0 auto",
  });

  return (
    <div style={wrap}>
      <div style={card}>
        <WerkplekIcoon />
        <img src="/werkplek/wordmark-navy.svg" alt="StudioBaris" width={149} height={48} style={{ display: "block", height: 48, width: "auto", marginLeft: -6 }} />
        <h1 style={{ fontSize: 22, margin: "8px 0 2px", color: "#1A2B3D" }}>Werkplek</h1>

        {!gekozen && (
          <>
            <p style={{ color: "#4A5560", fontSize: 14, marginTop: 4 }}>Kies je naam om in te loggen.</p>
            {beheer.length > 0 && (
              <div style={{ fontSize: 11, fontWeight: 700, color: "#6F7A85", textTransform: "uppercase", letterSpacing: 1, margin: "14px 0 8px" }}>Beheer</div>
            )}
            {beheer.map((t) => (
              <button key={t.id} type="button" style={naamBtn(false)} onClick={() => { setGekozen(t); setPw(""); setPw2(""); setFout(""); }}>
                <span style={bol("#1A2B3D")}>{t.naam.charAt(0).toUpperCase()}</span>{t.naam}
              </button>
            ))}
            {verkopers.length > 0 && (
              <div style={{ fontSize: 11, fontWeight: 700, color: "#6F7A85", textTransform: "uppercase", letterSpacing: 1, margin: "14px 0 8px" }}>Verkoop</div>
            )}
            {verkopers.map((t) => (
              <button key={t.id} type="button" style={naamBtn(false)} onClick={() => { setGekozen(t); setPw(""); setPw2(""); setFout(""); }}>
                <span style={bol("#7E5F28")}>{t.naam.charAt(0).toUpperCase()}</span>{t.naam}
              </button>
            ))}
            {team.length === 0 && (
              <p style={{ color: "#b91c1c", fontSize: 14, marginTop: 12 }}>Geen accounts gevonden.</p>
            )}
          </>
        )}

        {gekozen && (
          <form onSubmit={login}>
            <button type="button" onClick={() => { setGekozen(null); setFout(""); }}
              style={{ background: "none", border: "none", color: "#4A5560", cursor: "pointer", padding: "8px 0", fontSize: 14 }}>
              ← andere naam
            </button>
            <div style={{ ...naamBtn(true), cursor: "default", marginTop: 4 }}>
              <span style={bol(gekozen.rol === "beheer" ? "#1A2B3D" : "#7E5F28")}>{gekozen.naam.charAt(0).toUpperCase()}</span>
              {gekozen.naam}
            </div>

            {!gekozen.gezet ? (
              <>
                <p style={{ color: "#854f0b", background: "#faeeda", padding: "10px 12px", borderRadius: 10, fontSize: 13.5, marginTop: 8 }}>
                  Eerste keer inloggen — stel nu je eigen wachtwoord in.
                </p>
                <input type="password" style={inp} placeholder="Kies een wachtwoord" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus />
                <input type="password" style={inp} placeholder="Herhaal wachtwoord" value={pw2} onChange={(e) => setPw2(e.target.value)} />
              </>
            ) : (
              <input type="password" style={inp} placeholder="Wachtwoord" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus />
            )}

            {fout && <p style={{ color: "#b91c1c", fontSize: 14, marginTop: 10 }}>{fout}</p>}

            <button type="submit" disabled={bezig}
              style={{ width: "100%", marginTop: 14, background: "#C79A56", color: "#1A2B3D", border: "none", padding: "13px", borderRadius: 999, fontWeight: 700, fontSize: 16, cursor: "pointer" }}>
              {bezig ? "Bezig…" : gekozen.gezet ? "Inloggen" : "Wachtwoord instellen & inloggen"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
