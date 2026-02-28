import type { Metadata } from "next";
import { Outfit, Geist_Mono, Playfair_Display } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ProjectsProvider } from "@/context/projects-context";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { OzzieChat } from "@/components/features/OzzieChat";
import { CookieBanner } from "@/components/cookie-banner";
import { ActivityTracker } from "@/components/activity-tracker";
import { AuthSessionProvider } from "@/components/providers/session-provider";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "modeon.ai - AI Moda Görsel Üretimi",
  description: "Ürün fotoğraflarınızı saniyeler içinde profesyonel moda görsellerine dönüştürün. AI destekli fashion photoshoot platformu.",
  metadataBase: new URL("https://modeon.ai"),
  openGraph: {
    title: "modeon.ai - AI Moda Görsel Üretimi",
    description: "Ürün fotoğraflarınızı saniyeler içinde profesyonel moda görsellerine dönüştürün.",
    url: "https://modeon.ai",
    siteName: "modeon.ai",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "modeon.ai - AI Fashion Platform",
      },
    ],
    locale: "tr_TR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "modeon.ai - AI Moda Görsel Üretimi",
    description: "Ürün fotoğraflarınızı saniyeler içinde profesyonel moda görsellerine dönüştürün.",
    images: ["/og-image.jpg"],
  },
};

import { LanguageProvider } from "@/context/language-context";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="dark" suppressHydrationWarning>
      <head>
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-H4CN3C7HRS"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-H4CN3C7HRS');
          `}
        </Script>
      </head>
      <body
        className={`${outfit.variable} ${playfair.variable} ${geistMono.variable} antialiased font-sans`}
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
