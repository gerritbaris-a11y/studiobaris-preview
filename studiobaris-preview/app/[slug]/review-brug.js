// Korte regel onder de reviews op de preview (okt 2026).
// Op een preview zonder echte reviews vult lib/preview-voorbeeld.js de plek
// met voorbeeldreviews ("Jan (voorbeeld)"). Deze regel maakt daar het
// verkoopargument van: met de app vraag je zelf na elke klus een review, en
// die komt precies hier te staan. Alleen op de preview die de prospect ziet
// (isReview), nooit in concept/werkversie en nooit op een echte klantsite.

export const REVIEW_PLEK = "Hier komt straks een echte review van je klant.";

export default function ReviewBrug({ content, isReview }) {
  if (!isReview || !content || !content.reviews_voorbeeld) return null;
  return (
    <p style={{
      margin: "1.4rem auto 0", maxWidth: 560, padding: ".75rem 1rem", borderRadius: 12,
      border: "1.5px dashed currentColor", opacity: 0.85, fontSize: ".92rem", lineHeight: 1.5, textAlign: "center",
    }}>
      <strong>Dit zijn voorbeeldreviews.</strong> Met je app vraag je na elke klus zelf een review aan je klant.
      Die komt hier te staan, en dat maakt het verschil met een beunhaas.
    </p>
  );
}
