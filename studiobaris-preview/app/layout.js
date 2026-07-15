import "./globals.css";
import WerkplekChrome from "./werkplek-chrome";

export const metadata = {
  title: "StudioBaris",
  description: "Website preview",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="nl">
      <body>
        {children}
        <WerkplekChrome />
      </body>
    </html>
  );
}
