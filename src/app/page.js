/**
 * / — White Premium лендинг (дизайн из DigitalEmlakPlatform)
 */

import PremiumLanding from "@/components/landing/PremiumLanding";
import { LocaleProvider } from "@/lib/i18n/LocaleProvider";

export default function HomePage() {
  return (
    <LocaleProvider defaultLocale="az">
      <PremiumLanding />
    </LocaleProvider>
  );
}
