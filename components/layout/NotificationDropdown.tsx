"use client";

import React, { useState, useRef, useEffect } from "react";
import { useNotifications } from "@/components/providers/NotificationProvider";

export default function NotificationDropdown() {
  const { notifications, unreadCount, markAsRead, clearNotifications } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="notification-wrapper" ref={dropdownRef} style={{ position: "relative" }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="theme-toggle-btn"
        style={{
          display: "grid",
          placeItems: "center",
          width: "42px",
          height: "42px",
          padding: 0,
          borderRadius: "12px",
          border: "1.5px solid var(--border)",
          background: "var(--surface-2)",
          color: "var(--text)",
          cursor: "pointer",
          transition: "all 0.2s ease",
          position: "relative"
        }}
        title="Notificaciones"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span style={{
            position: "absolute",
            top: "-2px",
            right: "-2px",
            background: "var(--primary)",
            color: "black",
            fontSize: "10px",
            fontWeight: 800,
            width: "18px",
            height: "18px",
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            border: "2px solid var(--surface)"
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown" style={{
          position: "absolute",
          top: "60px",
          right: "0",
          width: "320px",
          background: "var(--surface)",
          border: "1.5px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-lg)",
          zIndex: 1000,
          overflow: "hidden",
          animation: "page-in 300ms var(--ease-out-expo)"
        }}>
          <div style={{
            padding: "16px",
            borderBottom: "1.5px solid var(--border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "rgba(212, 255, 0, 0.03)"
          }}>
            <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 800 }}>Notificaciones</h4>
            {notifications.length > 0 && (
              <button 
                onClick={clearNotifications}
                style={{ 
                  background: "none", 
                  border: "none", 
                  color: "var(--primary)", 
                  fontSize: "11px", 
                  fontWeight: 700,
                  cursor: "pointer",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em"
                }}
              >
                Limpiar
              </button>
            )}
          </div>

          <div style={{ maxHeight: "360px", overflowY: "auto" }}>
            {notifications.length > 0 ? (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => markAsRead(n.id)}
                  style={{
                    padding: "16px",
                    borderBottom: "1px solid var(--border)",
                    cursor: "pointer",
                    background: n.read ? "transparent" : "rgba(212, 255, 0, 0.05)",
                    transition: "background 0.2s ease"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span style={{ 
                      fontSize: "12px", 
                      fontWeight: 800,
                      color: n.type === "error" ? "#FF3B30" : "var(--text)"
                    }}>
                      {n.title}
                    </span>
                    <span style={{ fontSize: "10px", color: "var(--muted)" }}>
                      {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: "13px", color: "var(--muted)", lineHeight: "1.4" }}>
                    {n.description}
                  </p>
                </div>
              ))
            ) : (
              <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--muted)" }}>
                <div style={{ fontSize: "24px", marginBottom: "8px" }}>🔔</div>
                <p style={{ margin: 0, fontSize: "13px" }}>No hay notificaciones recientes</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
