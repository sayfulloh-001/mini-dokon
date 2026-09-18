import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AntiInspect } from "@/components/security/AntiInspect";

export const metadata: Metadata = {
  title: "SY Tizim",
  description: "SY Tizim — Tezkor do‘kon boshqaruvi",
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
