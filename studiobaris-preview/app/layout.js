import "./globals.css";
import InstallPrompt from "./install-prompt";

export const metadata = {
  title: "StudioBaris",
  description: "StudioBaris — leads, previews en klanten",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "StudioBaris" },
  icons: {
    icon: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icon-192.png", sizes: "192x192" }],
  },
};

export const viewport = {
  themeColor: "#1A2E40",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="nl">
      <body>
        {children}
        <InstallPrompt />
      </body>
    </html>
  );
}
