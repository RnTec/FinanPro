import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FinanPro | Gestão Financeira Inteligente",
  description: "Controle suas finanças pessoais com inteligência artificial. Dashboard interativo, OCR, categorização automática e muito mais.",
  manifest: "/manifest.json",
  themeColor: "#0f172a",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FinanPro",
  },
  icons: {
    apple: "/icon-192.png",
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
