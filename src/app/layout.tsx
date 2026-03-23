import type React from "react";
import "./globals.css";
import type { Metadata } from "next";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Academic Sentinel - Attendance Dashboard",
  description:
    "Biometric facial recognition attendance system for academic institutions",
  keywords: [
    "facial recognition",
    "attendance",
    "biometric",
    "academic",
    "face-api.js",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
        <Script src="/modules/face-api.min.js" strategy="beforeInteractive" />
      </head>
      <body className="bg-surface text-on-surface min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
