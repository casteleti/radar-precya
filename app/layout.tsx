import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const font = Plus_Jakarta_Sans({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Radar Precya",
  description: "Calculadora inteligente de precificação para clínicas de estética",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${font.className} h-full`}>
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
