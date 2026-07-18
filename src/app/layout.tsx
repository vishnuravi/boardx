import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Abridge's surfaces use Inter; BoardX renders inside them, so it does too.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "BoardX",
  description:
    "Clinician-supervised continuity agent for admitted patients boarding in the ED.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
