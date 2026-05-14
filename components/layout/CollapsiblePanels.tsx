"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const PANEL_SELECTOR = ".section-card";

function preparePanels() {
  document.querySelectorAll<HTMLElement>(PANEL_SELECTOR).forEach((panel) => {
    const hasDataTable = panel.querySelector(".data-table");

    if (!hasDataTable) {
      panel.classList.remove("collapsible-panel", "is-collapsed");
      delete panel.dataset.collapseHint;
      return;
    }

    panel.classList.add("collapsible-panel");
    panel.dataset.collapseHint = panel.classList.contains("is-collapsed")
      ? "Ampliar"
      : "Colapsar";
  });
}

function isToggleArea(event: MouseEvent, panel: HTMLElement) {
  const rect = panel.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  return x >= rect.width - 48 && y <= 48;
}

export default function CollapsiblePanels() {
  const pathname = usePathname();

  useEffect(() => {
    preparePanels();

    const observer = new MutationObserver(() => {
      window.requestAnimationFrame(preparePanels);
    });

    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const panel = target?.closest<HTMLElement>(PANEL_SELECTOR);

      if (!panel || !isToggleArea(event, panel)) return;

      event.preventDefault();
      event.stopPropagation();

      const isCollapsed = panel.classList.toggle("is-collapsed");
      panel.dataset.collapseHint = isCollapsed ? "Ampliar" : "Colapsar";
    };

    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener("click", onClick, true);

    return () => {
      observer.disconnect();
      document.removeEventListener("click", onClick, true);
    };
  }, [pathname]);

  return null;
}
