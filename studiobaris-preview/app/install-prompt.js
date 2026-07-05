"use client";

import { useEffect, useState } from "react";

// Installeer-balk: op Chrome/Android een echte "Installeren"-knop,
// op iPhone/Safari een korte uitleg (Apple staat geen auto-pop-up toe).
export default function InstallPrompt() {
  const [deferred, setDeferred] = useState(null);
  const [mode, setMode] = useState("none"); // none | android | ios

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    const nav = window.navigator;
    const standalone = window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
    if (standalone) return;
    try { if (localStorage.getItem("sb-admin-install-dismissed")) return; } catch {}

    const ua = nav.userAgent || "";
    const isIos = /iphone|ipad|ipod/i.test(ua) || (/(macintosh)/i.test(ua) && nav.maxTouchPoints > 1);
    if (isIos) { setMode("ios"); return; }

    const onBip = (e) => { e.preventDefault(); setDeferred(e); setMode("android"); };
    window.addEventListener("beforeinstallprompt", onBip);
    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  if (mode === "none") return null;

  async function install() {
    if (!deferred) return;
    deferred.prompt();
    try { await deferred.userChoice; } catch {}
    setDeferred(null); setMode("none");
  }
  function dismiss() {
    setMode("none");
    try { localStorage.setItem("sb-admin-install-dismissed", "1"); } catch {}
  }

  const bar = {
    position: "fixed", left: 12, right: 12, bottom: 12, zIndex: 9999,
    background: "#1A2E40", color: "#fff", borderRadius: 16,
    padding: "14px 14px 14px 16px", boxShadow: "0 12px 34px -10px rgba(0,0,0,.45)",
    fontFamily: "system-ui, sans-serif", display: "flex", alignItems: "center", gap: 12,
    maxWidth: 560, margin: "0 auto",
  };
  const logo = { flex: "0 0 auto", width: 38, height: 38, borderRadius: 10, background: "#F7B05B", color: "#1A2E40", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 16 };
  const btn = { flex: "0 0 auto", background: "#F7B05B", color: "#1A2E40", border: "none", borderRadius: 10, padding: "10px 16px", fontWeight: 700, fontSize: 14, cursor: "pointer" };
  const close = { flex: "0 0 auto", background: "transparent", color: "rgba(255,255,255,.7)", border: "none", fontSize: 20, lineHeight: 1, cursor: "pointer", padding: 4 };

  return (
    <div style={bar} role="dialog" aria-label="App installeren">
      <div style={logo}>SB</div>
      {mode === "android" ? (
        <>
          <div style={{ flex: 1, fontSize: 14, lineHeight: 1.35 }}>
            <strong>Zet StudioBaris op je telefoon</strong>
            <div style={{ opacity: 0.75, fontSize: 12 }}>Sneller openen, als een echte app.</div>
          </div>
          <button onClick={install} style={btn}>Installeren</button>
        </>
      ) : (
        <div style={{ flex: 1, fontSize: 13.5, lineHeight: 1.4 }}>
          <strong>Zet StudioBaris op je beginscherm</strong>
          <div style={{ opacity: 0.85 }}>Tik onderin op het deel-icoon en kies <strong>“Zet op beginscherm”</strong>.</div>
        </div>
      )}
      <button onClick={dismiss} style={close} aria-label="Sluiten">×</button>
    </div>
  );
}
