import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FinanPro | Gestão Financeira Inteligente",
  description: "Controle suas finanças pessoais com inteligência artificial. Dashboard interativo, OCR, categorização automática e muito mais.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
