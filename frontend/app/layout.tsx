import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Content Transformation Platform | SIH 26154",
  description: "Gen AI Platform for Automated Content Transformation — SIH 2026 Problem Statement 26154",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
