import type React from "react";
import "./globals.css";
import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";

export const metadata: Metadata = {
  title: "Project Face Reg",
  description:
    "Biometric facial recognition attendance system for academic institutions using machine learning. Offline-first capable.",
  keywords: [
    "facial recognition",
    "attendance",
    "biometric",
    "academic",
    "face-api.js",
  ],
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FaceReg",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
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
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
