import type { Metadata } from "next";
import { Inter } from "next/font/google"; // 🚨 1. Import the font
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs'

// 🚨 2. Initialize the font
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Intern Placement System",
  description: "Connect students with internships",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        {/* 🚨 3. Apply the font to the body, and add "antialiased" to make it sharp! */}
        <body className={`${inter.className} antialiased bg-neutral-50 text-neutral-900`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}