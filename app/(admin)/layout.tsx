"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import PostLoginShutter from "@/components/layout/PostLoginShutter";
import RouteLoadingOverlay from "@/components/layout/RouteLoadingOverlay";
import { useGsapButtons } from "@/hooks/useGsapButtons";
import { useAuth } from "@/components/providers/AuthProvider";

const clientAllowedPaths = ["/bookings", "/businesses", "/profile"];
const businessAllowedPaths = ["/bookings", "/profile"];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  useGsapButtons();

  useEffect(() => {
  if (isLoading) return;

  const publicPaths = ["/login", "/customers/nuevo"];

  if (!isAuthenticated) {
    if (!publicPaths.includes(pathname)) {
      router.replace("/login");
    }
    return;
  }

  if (user?.role === "client") {
    if (!clientAllowedPaths.includes(pathname)) {
      router.replace("/bookings");
    }
  }

  if (user?.role === "business") {
    if (!businessAllowedPaths.includes(pathname)) {
      router.replace("/bookings");
    }
  }
}, [isAuthenticated, isLoading, pathname, router, user]);

  if (isLoading) {
    return (
      <div className="route-loading">
        <div className="route-loading__card">
          <div className="route-loading__spinner"></div>
          <p className="route-loading__title">Validando sesion</p>
        </div>
      </div>
    );
  }

  


  return (
    <div className={`admin-shell admin-shell--${user?.role ?? "guest"} ${isCollapsed ? "admin-shell--collapsed" : ""}`}>
      <PostLoginShutter />
      <RouteLoadingOverlay />
      <Sidebar isCollapsed={isCollapsed} onToggle={() => setIsCollapsed(!isCollapsed)} />

      <div className="admin-main">
        <Header />
        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
}
