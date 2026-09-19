import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AntiInspect } from "@/components/security/AntiInspect";

export const metadata: Metadata = {
  title: "SY Tizim",
  description: "SY Tizim — Tezkor va qulay do‘kon boshqaruvi",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SY Tizim",
  },
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#059669",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uz">
      <body className="bg-slate-50 text-slate-900 antialiased selection:bg-emerald-100 selection:text-emerald-900 select-none">
        <AntiInspect />
        {children}
      </body>
    </html>
  );
}
