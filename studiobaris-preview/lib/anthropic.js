// Server-side aanroep van de Claude-API. Alleen gebruiken in server-routes.
const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";

// image (optioneel): { data: base64-string, media_type: "image/png" | "image/jpeg" | ... }
// Wordt als afbeelding meegestuurd zodat Claude bv. de huisstijlkleuren uit een logo kan afleiden.
export async function callClaude(system, user, image) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY ontbreekt.");

  const content =
    image && image.data
      ? [
          { type: "image", source: { type: "base64", media_type: image.media_type || "image/png", data: image.data } },
          { type: "text", text: user },
        ]
      : user;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4000,
      system,
      messages: [{ role: "user", content }],
    }),
  });
  if (!res.ok) throw new Error("Claude-fout: " + (await res.text()));
  const data = await res.json();
  return (data.content || []).map((c) => c.text || "").join("");
}
