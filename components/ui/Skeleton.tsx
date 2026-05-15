"use client";

import React from "react";

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  style?: React.CSSProperties;
}

export default function Skeleton({ className, width, height, borderRadius, style }: SkeletonProps) {
  return (
    <div
      className={`skeleton ${className || ""}`}
      style={{
        width: width || "100%",
        height: height || "20px",
        borderRadius: borderRadius || "8px",
        background: "linear-gradient(90deg, var(--surface-2) 25%, var(--border) 50%, var(--surface-2) 75%)",
        backgroundSize: "200% 100%",
        animation: "skeleton-loading 1.5s infinite linear",
        ...style,
      }}
    />
  );
}
