import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ProjectsProvider } from "@/context/projects-context";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { OzzieChat } from "@/components/features/OzzieChat";
import { CookieBanner } from "@/components/cookie-banner";
import { ActivityTracker } from "@/components/activity-tracker";
import { AuthSessionProvider } from "@/components/providers/session-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ModeOn.ai - AI Fashion Design",
  description: "AI-Powered Fashion Design & Photoshoot Platform",
};

import { LanguageProvider } from "@/context/language-context";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          disableTransitionOnChange
        >
          <LanguageProvider>
            <AuthSessionProvider session={null}>
              <ProjectsProvider>
                {children}
                <Toaster />
                <OzzieChat />
                <CookieBanner />
                <ActivityTracker />
              </ProjectsProvider>
            </AuthSessionProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
