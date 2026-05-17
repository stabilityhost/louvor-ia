import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Louvor IA - Plataforma de Inteligência Musical para Igrejas",
  description: "Plataforma inteligente offline-first (PWA) de auxílio musical em tempo real para igrejas. Detecção de tom, afinador cromático de alta precisão, previsão de próximas notas por IA, inversões de acordes no teclado/violão e memória progressiva por assinaturas digitais (fingerprints).",
  keywords: ["Música de Igreja", "IA Musical", "Web Audio API", "Afinador Cromático", "Teclado Inversão", "Cifra de Violão", "Offline First", "NextJS PWA"],
  authors: [{ name: "Gabriel", url: "https://antigravity.google" }]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
