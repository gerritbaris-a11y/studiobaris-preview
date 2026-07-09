// Server-only auth-helpers voor de werkplek.
// - Wachtwoorden: scrypt-hash met salt (Node crypto).
// - Sessie: JSON-payload, base64url, ondertekend met HMAC-SHA256.
//   De middleware verifieert dezelfde handtekening met Web Crypto (Edge).
import crypto from "crypto";
import { cookies } from "next/headers";

const COOKIE = "sb_sessie";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 dagen

function secret() {
  return (
    process.env.SESSION_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "studiobaris-dev-secret"
  );
}

// --- Wachtwoorden ---

export function hashWachtwoord(pw) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(String(pw), salt, 32).toString("hex");
  return `${salt}:${hash}`;
}

export function checkWachtwoord(pw, stored) {
  if (!stored || !stored.includes(":")) return false;
  const [salt, hash] = stored.split(":");
  const test = crypto.scryptSync(String(pw), salt, 32).toString("hex");
  const a = Buffer.from(hash, "hex");
  const b = Buffer.from(test, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// --- Sessie ---

function teken(body) {
  return crypto.createHmac("sha256", secret()).update(body).digest("base64url");
}

export function maakSessieToken(user) {
  const payload = {
    uid: user.id,
    rol: user.rol,
    naam: user.naam,
    exp: Date.now() + MAX_AGE * 1000,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${teken(body)}`;
}

// Zet de sessie-cookie (alleen aan te roepen vanuit een route handler).
export function zetSessie(user) {
  cookies().set(COOKIE, maakSessieToken(user), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export function wisSessie() {
  cookies().set(COOKIE, "", { path: "/", maxAge: 0 });
}

// Leest en verifieert de sessie (server components + routes).
export function leesSessie() {
  const c = cookies().get(COOKIE)?.value;
  if (!c || !c.includes(".")) return null;
  const [body, sig] = c.split(".");
  if (teken(body) !== sig) return null;
  try {
    const p = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (!p.exp || p.exp < Date.now()) return null;
    return p; // { uid, rol, naam, exp }
  } catch {
    return null;
  }
}

export function isBeheer(sessie) {
  return sessie && sessie.rol === "beheer";
}
