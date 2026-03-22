import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";
import SentryInit from "@/components/observability/SentryInit";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GenFlow — Visual Builder for GenLayer",
  description:
    "Build GenLayer Intelligent Contracts visually. Drag, drop, and generate production-ready Python code — no coding required.",
  keywords: ["GenLayer", "GenFlow", "No-Code", "Web3", "AI", "Smart Contracts", "Visual Builder"],
  openGraph: {
    title: "GenFlow — Visual Builder for GenLayer",
    description: "Drag & drop to build AI-powered Intelligent Contracts on GenLayer.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${inter.variable} antialiased dark`}
    >
      <body className="font-sans min-h-screen bg-background text-foreground">
        <SentryInit />
        {children}
      </body>
    </html>
  );
}
