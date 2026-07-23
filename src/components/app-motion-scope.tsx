"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export default function AppMotionScope({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith("/admin");

  if (isAdminRoute) {
    return <div className="contents">{children}</div>;
  }

  return (
    <div className="user-motion-scope contents">
      <div className="user-ambient-bg" aria-hidden="true">
        <span className="user-aurora user-aurora-one" />
        <span className="user-aurora user-aurora-two" />
        <span className="user-aurora user-aurora-three" />
        <span className="user-ambient-grid" />
        <span className="user-ambient-noise" />
      </div>
      {children}
    </div>
  );
}
