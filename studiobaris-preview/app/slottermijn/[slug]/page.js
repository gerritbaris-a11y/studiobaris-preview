// Nettere naam voor de restbetalingspagina. Zelfde pagina, zelfde werking;
// het oude adres /restbetaling/<slug> blijft ook bestaan.
import RestbetalingPage from "../../restbetaling/[slug]/page";

export const dynamic = "force-dynamic";

export default function SlottermijnPage(props) {
  return <RestbetalingPage {...props} />;
}
