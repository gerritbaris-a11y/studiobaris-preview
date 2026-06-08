import "./globals.css";

export const metadata = {
  title: "Preview",
  description: "Website preview",
};

export default function RootLayout({ children }) {
  return (
    <html lang="nl">
      <body>{children}</body>
    </html>
  );
}
