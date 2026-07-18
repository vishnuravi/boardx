import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BoardX in Abridge",
  description:
    "Clinician-supervised continuity agent for admitted patients boarding in the ED.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/*
          Same font and icon sources the mockup loads, so glyphs match exactly.
          Loading Inter here rather than via next/font is deliberate: the ported
          stylesheet declares `font-family: 'Inter'` literally, and next/font
          would expose it under a generated family name instead.

          The lint rule below targets the pages router, where a head link only
          applies to one page. In the app router this is the root layout, so it
          is global — the warning does not apply.
        */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.24.0/dist/tabler-icons.min.css"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
