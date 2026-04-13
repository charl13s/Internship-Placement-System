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
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: '#171717', // This is Tailwind's neutral-900
          colorText: '#171717',
          colorTextSecondary: '#737373', // Tailwind's neutral-500
          colorBackground: '#ffffff',
          colorInputBackground: '#ffffff',
          colorInputText: '#171717',
          borderRadius: '0.75rem', // Matches your rounded-xl aesthetic
        },
        elements: {
          // Customizing specific pieces of the Clerk UI with Tailwind classes
          card: 'shadow-2xl shadow-neutral-200/50 border border-neutral-200 rounded-2xl',
          formButtonPrimary: 'bg-neutral-900 hover:bg-neutral-800 text-white shadow-sm transition-all',
          socialButtonsBlockButton: 'border-neutral-200 hover:bg-neutral-50 transition-all text-neutral-600 font-medium',
          footerActionLink: 'text-neutral-900 hover:text-neutral-700 font-semibold',
          formFieldInput: 'border-neutral-200 focus:ring-2 focus:ring-neutral-900 transition-all shadow-sm',
          formFieldLabel: 'font-semibold text-neutral-700 uppercase tracking-wider text-xs',
          headerTitle: 'font-extrabold text-2xl tracking-tight text-neutral-900',
          headerSubtitle: 'text-neutral-500',
          dividerLine: 'bg-neutral-200',
          dividerText: 'text-neutral-400',
        }
      }}
    >
      <html lang="en" suppressHydrationWarning>
        <body className={`${inter.className} antialiased bg-neutral-50 text-neutral-900`} suppressHydrationWarning>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}