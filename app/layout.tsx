import type { Metadata } from "next";
import { SELLER_BRAND } from "@/lib/brand";
import "./globals.css";

export const metadata: Metadata = {
  title: `${SELLER_BRAND} — Phone Academy`,
  description: "Seller-line voice training and certification",
  // Internal training tool: trainee links carry recordings and transcripts,
  // so no page here should ever be indexed if a link gets shared.
  robots: { index: false, follow: false, nocache: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
