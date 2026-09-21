"use client";

import { MapPage } from "@/components/terminal/PanelPages";
import ProGate from "@/components/terminal/ProGate";

export default function Page() {
  return (
    <ProGate feature="map">
      <MapPage />
    </ProGate>
  );
}
