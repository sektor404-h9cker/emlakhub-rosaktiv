"use client";

import { PortfolioPage } from "@/components/terminal/PanelPages";
import ProGate from "@/components/terminal/ProGate";

export default function Page() {
  return (
    <ProGate feature="portfolio">
      <PortfolioPage />
    </ProGate>
  );
}
