import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { SITE, SITE_URL } from "@/lib/config";
import { WalletProvider } from "@/lib/wallet/WalletProvider";
import "./globals.css";
import "./components.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["italic"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE.fullName} — ${SITE.tagline}`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  openGraph: {
    title: `${SITE.fullName} — ${SITE.tagline}`,
    description: SITE.description,
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#050705",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable}`}
    >
      <body>
        <div className="backdrop" aria-hidden="true" />
        <WalletProvider>
          <Header />
          <main>{children}</main>
          <Footer />
        </WalletProvider>
      </body>
    </html>
  );
}
