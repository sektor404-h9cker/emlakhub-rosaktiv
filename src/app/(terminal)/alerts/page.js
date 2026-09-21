"use client";

import { AlertsPage } from "@/components/terminal/PanelPages";
import ProGate from "@/components/terminal/ProGate";

export default function Page() {
  return (
    <ProGate feature="feature">
      <AlertsPage />
    </ProGate>
  );
}
