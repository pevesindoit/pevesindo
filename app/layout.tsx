import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import NavBar from "./component/NavBar";
import 'leaflet/dist/leaflet.css';
import { Analytics } from "@vercel/analytics/next"

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Aplikasi Pengantaran Pevesindo",
  description: "Digunakan untuk mempermudah proses pengantaran barang Pevesindo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} antialiased bg-[#F9FAFB]`}
      >
        <Analytics />
        <NavBar />
        {children}
      </body>
    </html>
  );
}
