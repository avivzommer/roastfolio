import type { Metadata } from "next";
import Script from "next/script";
import {
  Bricolage_Grotesque,
  IBM_Plex_Sans,
  IBM_Plex_Mono,
  Inter,
  JetBrains_Mono,
  Newsreader,
  Press_Start_2P,
  Source_Serif_4,
  VT323,
} from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";

// Existing review-page typography (kept so the review pages don't shift).
const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

// Roastfolio brand typography — editorial display + clean body + utility mono.
const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const pressStart = Press_Start_2P({
  variable: "--font-press-start",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

const vt323 = VT323({
  variable: "--font-vt323",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

// Closest free Google equivalent to Anthropic's Tiempos display.
const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Roastfolio — Know if your portfolio is ready for hiring",
    template: "%s · Roastfolio",
  },
  description:
    "See your portfolio the way a hiring manager would. Get an honest read on what's working, what's holding you back, and the concrete moves that get you more interviews.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plexSans.variable} ${plexMono.variable} ${newsreader.variable} ${inter.variable} ${jetbrainsMono.variable} ${bricolage.variable} ${pressStart.variable} ${vt323.variable} ${sourceSerif.variable} h-full antialiased`}
    >
      <body className="bg-background text-foreground flex min-h-full flex-col font-sans">
        <TooltipProvider delay={200}>
          {children}
        </TooltipProvider>
        {/* Cloudflare Web Analytics — only load in production so local dev
            traffic isn't counted. */}
        {process.env.NODE_ENV === "production" && (
          <Script
            strategy="afterInteractive"
            src="https://static.cloudflareinsights.com/beacon.min.js"
            data-cf-beacon='{"token": "126130a377a648b0bf00438477b20524"}'
          />
        )}
      </body>
    </html>
  );
}
