import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { lerTema } from "@/lib/tema-servidor";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Catira",
  description: "Controle pessoal de negociações de veículos",
};

// Só roda quando tema === "sistema" (ausência de preferência salva). Aplica a classe `dark`
// antes da primeira pintura para não haver flash — script inline síncrono no <head>, nunca em
// Client Component (que só executaria depois da hidratação).
const SCRIPT_NO_FLASH = `(function(){try{if(window.matchMedia("(prefers-color-scheme: dark)").matches){document.documentElement.classList.add("dark");}}catch(e){}})();`;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const tema = await lerTema();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased${
        tema === "escuro" ? " dark" : ""
      }`}
      suppressHydrationWarning
    >
      <head>
        {tema === "sistema" && (
          <script dangerouslySetInnerHTML={{ __html: SCRIPT_NO_FLASH }} />
        )}
      </head>
      <body className="min-h-full flex flex-col">
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster />
      </body>
    </html>
  );
}
