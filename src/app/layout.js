// src/app/layout.js

import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner"; // Import from sonner

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Mar-Intel Search",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
