import { redirect } from "next/navigation";

// Was "Previews test → Leads"; nu Previews → Boeking & Sfeer → Leads.
export default function EsthetiekLeadsPage() {
  redirect("/leads?sector=boeking");
}
