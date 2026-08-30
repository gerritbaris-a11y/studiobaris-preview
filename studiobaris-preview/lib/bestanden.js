// Bestandsopslag voor zelfgemaakte factuur-/offerte-PDF's (Supabase Storage,
// bucket "facturen-offertes" — privé, alleen server-side bereikbaar met de
// service-role sleutel). Server-only, nooit client-side importeren.

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ipiqrsxbsgylxhgzlhsd.supabase.co";
const BUCKET = "facturen-offertes";

function key() {
  const k = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!k) throw new Error("SUPABASE_SERVICE_ROLE_KEY ontbreekt in de serveromgeving.");
  return k;
}

// pad bijv. "facturen/2026-005.pdf" — geeft dat pad terug zodat het in de
// database gezet kan worden (workflow.facturen.pdf_url / workflow.offertes.pdf_url).
export async function uploadBestand(pad, bytes, contentType = "application/pdf") {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${pad}`, {
    method: "POST",
    headers: {
      apikey: key(),
      Authorization: `Bearer ${key()}`,
      "Content-Type": contentType,
      "x-upsert": "true",
    },
    body: bytes,
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Uploaden mislukte (${res.status}): ${t.slice(0, 200)}`);
  }
  return pad;
}

export async function haalBestandOp(pad) {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${pad}`, {
    headers: { apikey: key(), Authorization: `Bearer ${key()}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  return Buffer.from(await res.arrayBuffer());
}
