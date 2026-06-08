// Server-side aanroep van de Claude-API. Alleen gebruiken in server-routes.
const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";

export async function callClaude(system, user) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY ontbreekt.");
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
      messages: [{ role: "user", content: user }],
    }),
  });
  if (!res.ok) throw new Error("Claude-fout: " + (await res.text()));
  const data = await res.json();
  return (data.content || []).map((c) => c.text || "").join("");
}
