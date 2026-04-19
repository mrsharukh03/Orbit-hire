import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Footer from "@/components/layout/footer";
import Navbar from "@/components/layout/navbar";
import { DarkModeProvider } from "@/context/DarkModeContext";
import { AuthProvider } from "@/context/AuthContext";
import { ToastContainer } from "@/components/ui/Toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OrbitHire — AI-Powered Job Portal",
  description: "Find your dream job with AI-matched recommendations. OrbitHire uses advanced AI to perfectly match your skills with top companies.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <AuthProvider>
          <DarkModeProvider>
            <Navbar />
            {children}
            <Footer />
            <ToastContainer />
          </DarkModeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}