"use client";

/**
 * /dashboard - клиентский терминал инвестора
 */

import InvestorDashboard from "@/components/terminal/InvestorDashboard";
import ProGate from "@/components/terminal/ProGate";

export default function DashboardPage() {
  return (
    <ProGate feature="feature">
      <InvestorDashboard />
    </ProGate>
  );
}
