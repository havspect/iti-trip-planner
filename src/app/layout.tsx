import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/NavBar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Trip Planner",
  description:
    "Plan your trips with an interactive map-based itinerary builder",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="h-full">
        <Navbar />
        <main className={`${inter.className} h-full`}>{children}</main>
      </body>
    </html>
  );
}
