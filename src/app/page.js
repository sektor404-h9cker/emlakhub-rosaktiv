import PremiumLanding from "@/components/landing/PremiumLanding";
import { LocaleProvider } from "@/lib/i18n/LocaleProvider";

export const metadata = {
  title: "Digital Emlak Hub - B2B-терминал госаукционов Азербайджана",
  description:
    "Закрытый B2B-терминал Digital Emlak Hub: рыночные аналоги, риски из карточки лота и прибыль после вашей цифры ремонта. Азербайджан — в работе. RosAktiv Hub для России — в разработке.",
  alternates: {
    canonical: "https://emlakhub.net/",
    languages: {
      az: "https://emlakhub.net/",
      ru: "https://emlakhub.net/",
      "x-default": "https://emlakhub.net/",
    },
  },
};

export default function HomePage() {
  return (
    <LocaleProvider defaultLocale="az">
      <PremiumLanding />
    </LocaleProvider>
  );
}
