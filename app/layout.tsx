import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ProjectsProvider } from "@/context/projects-context";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { OzzieChat } from "@/components/ozzie-chat";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "rawless.ai - AI Fashion Design",
  description: "AI-Powered Fashion Design & Photoshoot Platform",
};

import { LanguageProvider } from "@/context/language-context";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <LanguageProvider>
            <ProjectsProvider>
              {children}
              <Toaster />
              <OzzieChat />
            </ProjectsProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
