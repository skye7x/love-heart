import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "I Love You",
  description: "A spinning heart made of love",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
