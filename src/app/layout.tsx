import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
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
      className={`${geistSans.variable} ${geistMono.variable} antialiased dark`}
    >
      <body className="min-h-screen bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
