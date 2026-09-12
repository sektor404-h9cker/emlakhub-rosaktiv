/**
 * ROOT LAYOUT — SEO + типографика
 * Display: Playfair Display · Body: Manrope
 */

import { Manrope, Playfair_Display } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/landing/SmoothScroll";
import Providers from "@/components/Providers";

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

export const metadata = {
  metadataBase: new URL("https://emlakhub.net"),
  title: {
    default: "Digital Emlak Hub - B2B терминал госаукционов",
    template: "%s · Digital Emlak Hub",
  },
  description:
    "Аналитическая B2B-платформа для инвесторов: маржа, due diligence и рыночная оценка лотов на государственных аукционах. Digital Emlak Hub (Азербайджан). RosAktiv Hub для России - в разработке, скоро доступен.",
  keywords: [
    "госаукционы",
    "инвестиции в недвижимость",
    "Digital Emlak Hub",
    "RosAktiv Hub",
    "B2B аналитика",
    "due diligence",
    "unit economics",
  ],
  openGraph: {
    type: "website",
    locale: "ru_RU",
    alternateLocale: ["az_AZ"],
    url: "https://emlakhub.net",
    siteName: "Digital Emlak Hub",
    title: "Digital Emlak Hub - прозрачность государственных торгов",
    description:
      "Закрытый аналитический терминал для капитала. RosAktiv Hub для России - скоро.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Digital Emlak Hub - B2B терминал госаукционов",
    description:
      "Маржа, прозрачность и аналитика лотов. RosAktiv Hub - в разработке для России.",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body className={`${manrope.variable} ${playfair.variable} font-sans antialiased`}>
        <Providers>
          <SmoothScroll />
          {children}
        </Providers>
      </body>
    </html>
  );
}
