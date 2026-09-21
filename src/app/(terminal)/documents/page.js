"use client";

import { DocumentsPage } from "@/components/terminal/PanelPages";
import ProGate from "@/components/terminal/ProGate";

export default function Page() {
  return (
    <ProGate feature="feature">
      <DocumentsPage />
    </ProGate>
  );
}
