import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext"; 
import AppMotionScope from "@/components/app-motion-scope";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Skill Swap Hub",
  description:
    "A trusted platform where verified university students offer skills and buyers can request services with confidence.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // The root layout loads fonts and shares authentication with every route.
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col" suppressHydrationWarning>
        {/* Client pages read the signed-in user and profile from this provider. */}
        <AuthProvider>
          <AppMotionScope>{children}</AppMotionScope>
        </AuthProvider> 
      </body> 
    </html>
  );
}
