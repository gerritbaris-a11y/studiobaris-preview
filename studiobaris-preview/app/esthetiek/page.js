import { redirect } from "next/navigation";

// Was "Previews test → Mijn previews esthetiek"; nu Previews → Boeking & Sfeer.
export default function EsthetiekPage() {
  redirect("/klanten?sector=boeking");
}
