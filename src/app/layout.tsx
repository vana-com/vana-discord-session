import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DevCord",
  description:
    "A demo chat app used in the Vana Data Portability API walkthrough. Starts with zero knowledge of its users.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
