import type { Metadata } from "next";
import { SELLER_BRAND } from "@/lib/academy";
import "./globals.css";

export const metadata: Metadata = {
  title: `${SELLER_BRAND} — Phone Academy`,
  description: "Seller-line voice training and certification",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
