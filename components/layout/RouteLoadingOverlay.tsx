"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function RouteLoadingOverlay() {
  const pathname = usePathname();

  return <TimedRouteLoading key={pathname} />;
}

function TimedRouteLoading() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setIsVisible(false);
    }, 1000);

    return () => window.clearTimeout(timeoutId);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="route-loading" role="status" aria-live="polite">
      <div className="route-loading__card">
        <div className="route-loading__spinner" aria-hidden="true" />
        <p className="route-loading__title">Cargando...</p>
      </div>
    </div>
  );
}
