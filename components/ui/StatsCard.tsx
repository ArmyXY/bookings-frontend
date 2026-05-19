"use client";

import Link from "next/link";
import Skeleton from "./Skeleton";

interface StatsCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  href?: string;
  loading?: boolean;
  trend?: {
    value: string;
    positive: boolean;
  };
}

export default function StatsCard({ title, value, subtitle, icon, href, loading, trend }: StatsCardProps) {
  if (loading) {
    return (
      <div className="kpi-card" style={{ padding: "32px", border: "1.5px solid var(--border)" }}>
        <Skeleton width="40px" height="40px" borderRadius="12px" style={{ marginBottom: "16px" }} />
        <Skeleton width="60%" height="32px" style={{ marginBottom: "8px" }} />
        <Skeleton width="40%" height="16px" />
      </div>
    );
  }

  const card = (
    <div className={`kpi-card ${href ? "kpi-card--link" : ""}`} style={{
      display: "flex", 
      flexDirection: "column", 
      gap: "12px", 
      position: "relative", 
      overflow: "hidden",
      border: "1.5px solid var(--border)",
      boxShadow: "var(--shadow-sm)",
      padding: "32px"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ 
          padding: "12px", 
          borderRadius: "14px", 
          background: "var(--primary)", 
          color: "var(--primary-text)",
          display: "grid",
          placeItems: "center",
          boxShadow: "0 4px 12px rgba(212, 255, 0, 0.15)"
        }}>
          {icon}
        </div>
        {trend && (
          <span style={{ 
            fontSize: "12px", 
            fontWeight: 800, 
            color: trend.positive ? "#10B981" : "#EF4444",
            background: trend.positive ? "rgba(16, 185, 129, 0.08)" : "rgba(239, 68, 68, 0.08)",
            padding: "6px 10px",
            borderRadius: "100px",
            display: "flex",
            alignItems: "center",
            gap: "4px"
          }}>
            {trend.positive ? "↑" : "↓"} {trend.value}
          </span>
        )}
      </div>

      <div>
        <h4 style={{ margin: 0, color: "var(--muted)", fontSize: "14px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {title}
        </h4>
        <div style={{ 
          fontSize: "32px", 
          fontWeight: 800, 
          margin: "4px 0",
          letterSpacing: "-0.02em"
        }}>
          {value}
        </div>
        <p style={{ margin: 0, color: "var(--muted-2)", fontSize: "13px", fontWeight: 500 }}>
          {subtitle}
        </p>
      </div>
    </div>
  );

  if (!href) return card;

  return (
    <Link href={href} className="kpi-card-link">
      {card}
    </Link>
  );
}
