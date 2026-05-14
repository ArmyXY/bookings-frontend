"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menuItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    )
  },
  {
    label: "Reservas",
    href: "/bookings",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    )
  },
  {
    label: "Clientes",
    href: "/customers",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    )
  },
  {
    label: "Pagos",
    href: "/payments",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    )
  },
  {
    label: "Negocios",
    href: "/businesses",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    )
  },
];

export default function Sidebar({
  isCollapsed,
  onToggle
}: {
  isCollapsed: boolean;
  onToggle: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar__brand" style={{
        marginBottom: "40px",
        transition: "all 0.3s ease"
      }}>
        <div
          className="admin-sidebar__brand-inner"
          style={{
            background: "rgba(212, 255, 0, 0.08)",
            border: "1.5px solid rgba(212, 255, 0, 0.2)",
            borderRadius: "var(--radius-md)",
            padding: isCollapsed ? "16px 8px" : "20px",
            textAlign: "center",
            boxShadow: "var(--shadow-sm)",
            overflow: "hidden",
            whiteSpace: "nowrap",
            cursor: "pointer"
          }}
        >
          <h2 className="admin-sidebar__title" style={{
            margin: 0,
            fontSize: isCollapsed ? "18px" : "22px",
            color: "var(--text)",
            opacity: 1
          }}>
            {isCollapsed ? "BF" : "BookFlow"}
          </h2>
          {!isCollapsed && (
            <p className="admin-sidebar__subtitle" style={{
              margin: "4px 0 0",
              opacity: 0.6,
              fontSize: "12px",
              fontWeight: 600,
              letterSpacing: "0.05em",
              color: "var(--text)"
            }}>
              FINANCE AGENCY
            </p>
          )}
        </div>
      </div>

      <nav className="admin-sidebar__nav">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`admin-sidebar__link ${isActive ? "admin-sidebar__link--active" : ""}`}
              title={isCollapsed ? item.label : ""}
              style={{
                justifyContent: isCollapsed ? "center" : "flex-start",
                padding: isCollapsed ? "14px" : "14px 20px",
              }}
            >
              <span style={{ fontSize: "1.4rem", opacity: isActive ? 1 : 0.7 }}>{item.icon}</span>
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div style={{ marginTop: "auto", display: "flex", justifyContent: "center", paddingBottom: "12px" }}>
        <button
          onClick={onToggle}
          className="secondary-btn"
          style={{
            width: "48px",
            height: "48px",
            display: "grid",
            placeItems: "center",
            padding: 0,
            borderRadius: "12px",
            border: "1.5px solid var(--border)",
            transition: "all 0.3s var(--ease-out-expo)",
            position: "relative"
          }}
          title={isCollapsed ? "Expandir" : "Contraer"}
        >
          <div style={{
            width: "20px",
            height: "14px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            transition: "transform 0.4s var(--ease-out-expo)",
            transform: isCollapsed ? "rotate(180deg)" : "rotate(0)"
          }}>
            <div style={{ width: "100%", height: "2px", background: "var(--text)", borderRadius: "2px" }}></div>
            <div style={{ width: "70%", height: "2px", background: "var(--text)", borderRadius: "2px" }}></div>
            <div style={{ width: "100%", height: "2px", background: "var(--text)", borderRadius: "2px" }}></div>
          </div>
        </button>
      </div>
    </aside>
  );
}
