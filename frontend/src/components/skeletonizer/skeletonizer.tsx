// Skeletonizer.tsx
import React from "react";
import "./skeletonizer.css";

type SkeletonizerProps = {
  enabled: boolean;
  children: React.ReactNode;
};

export function Skeletonizer({ enabled, children }: SkeletonizerProps) {
  // Always render the same wrapper; only data attribute changes.
  return (
    <div
      className="skel-zone"
      data-skeleton={enabled ? "on" : "off"}
    >
      {children}
    </div>
  );
}
