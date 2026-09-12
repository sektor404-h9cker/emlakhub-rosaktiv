/**
 * ROOT LAYOUT — SEO + типографика
 * Display: Playfair Display · Body: Manrope
 */

import { Manrope, Playfair_Display } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/landing/SmoothScroll";
import Providers from "@/components/Providers";
import JsonLd from "@/components/seo/JsonLd";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const SITE = "https://emlakhub.net";
const OG_IMAGE = `${SITE}/landing/porsche-hero.jpg`;

export const metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: "Digital Emlak Hub — B2B-терминал госаукционов Азербайджана",
    template: "%s · Digital Emlak Hub",
  },
  description:
    "Digital Emlak Hub — закрытый B2B-терминал для инвесторов: скрытые риски, оценка ремонта и чистая маржа по лотам государственных аукционов до ставки. Азербайджан. RosAktiv Hub для России — скоро.",
  applicationName: "Digital Emlak Hub",
  authors: [{ name: "Camal Huseynov", url: SITE }],
  creator: "Camal Huseynov",
  publisher: "Digital Emlak Hub",
  category: "business",
  keywords: [
    "Digital Emlak Hub",
    "госаукционы Азербайджан",
    "herrac.gov.az аналитика",
    "инвестиции в недвижимость Баку",
    "государственные торги авто",
    "B2B терминал аукционов",
    "unit economics лота",
    "due diligence аукцион",
    "RosAktiv Hub",
    "Camal Huseynov",
  ],
  openGraph: {
    type: "website",
    locale: "az_AZ",
    alternateLocale: ["ru_RU", "en_US"],
    url: SITE,
    siteName: "Digital Emlak Hub",
    title: "Digital Emlak Hub — решение до ставки на госаукционах",
    description:
      "Риски, смета и чистая маржа до участия. Закрытый терминал для профессионального капитала. Основатель — Camal Huseynov.",
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "Digital Emlak Hub — аналитика лотов госаукционов",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Digital Emlak Hub — B2B-терминал госаукционов",
    description:
      "Маржа и риски до ставки. Азербайджан в работе · RosAktiv Hub для России — скоро.",
    images: [OG_IMAGE],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  alternates: {
    canonical: SITE,
    languages: {
      az: SITE,
      ru: SITE,
      "x-default": SITE,
    },
  },
  verification: {
    // Добавь токен из Google Search Console, когда подключим:
    // google: "YOUR_TOKEN",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="az">
      <head>
        <JsonLd />
      </head>
      <body className={`${manrope.variable} ${playfair.variable} font-sans antialiased`}>
        <Providers>
          <SmoothScroll />
          {children}
        </Providers>
      </body>
    </html>
  );
}
