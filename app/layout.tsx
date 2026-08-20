import type { Metadata } from "next";
import { Geist_Mono, Orbitron } from "next/font/google";
import "./globals.css";
import { brand } from "@/lib/config/brand";

const orbitron = Orbitron({
  variable: "--font-orbitron",
  weight: ["400", "500", "700"],
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: brand.name,
  description: brand.tagline,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${orbitron.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
