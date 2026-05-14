"use client";

import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import RouteLoadingOverlay from "@/components/layout/RouteLoadingOverlay";
import { useGsapButtons } from "@/hooks/useGsapButtons";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  useGsapButtons();


  return (
    <div className={`admin-shell ${isCollapsed ? "admin-shell--collapsed" : ""}`}>
      <RouteLoadingOverlay />
      <Sidebar isCollapsed={isCollapsed} onToggle={() => setIsCollapsed(!isCollapsed)} />

      <div className="admin-main">
        <Header />
        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
}
