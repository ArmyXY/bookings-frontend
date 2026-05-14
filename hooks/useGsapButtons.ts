"use client";

import { useEffect } from "react";
import gsap from "gsap";

export function useGsapButtons() {
  useEffect(() => {
    // We'll store the handlers so we can remove them if needed, though with MutationObserver it's tricky.
    // Instead, we just mark buttons we've already attached to.
    
    const attachAnimations = (node: Element) => {
      if (node.hasAttribute("data-gsap-attached")) return;
      
      const onMouseEnter = () => {
        gsap.to(node, { scale: 1.05, duration: 0.2, ease: "power2.out" });
      };
      const onMouseLeave = () => {
        gsap.to(node, { scale: 1, duration: 0.2, ease: "power2.out" });
      };
      const onMouseDown = () => {
        gsap.to(node, { scale: 0.95, duration: 0.1, ease: "power2.inOut" });
      };
      const onMouseUp = () => {
        gsap.to(node, { scale: 1.05, duration: 0.1, ease: "power2.inOut" });
      };

      node.addEventListener("mouseenter", onMouseEnter);
      node.addEventListener("mouseleave", onMouseLeave);
      node.addEventListener("mousedown", onMouseDown);
      node.addEventListener("mouseup", onMouseUp);

      node.setAttribute("data-gsap-attached", "true");
    };

    const attachToExisting = () => {
      const buttons = document.querySelectorAll(".primary-btn, .secondary-btn, .admin-sidebar__brand-inner");
      buttons.forEach(attachAnimations);
    };

    // Initial attach
    attachToExisting();

    // Observe DOM for new buttons
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length) {
          attachToExisting();
        }
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
    };
  }, []);
}
