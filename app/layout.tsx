import type { Metadata } from "next";
import "./globals.css";
import { brand } from "@/lib/config/brand";

export const metadata: Metadata = {
  title: brand.name,
  description: brand.tagline,
  icons: {
    icon: brand.logo,
    shortcut: brand.logo,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
