"use client";

import { ComparePage } from "@/components/terminal/PanelPages";
import ProGate from "@/components/terminal/ProGate";

export default function Page() {
  return (
    <ProGate feature="compare">
      <ComparePage />
    </ProGate>
  );
}
