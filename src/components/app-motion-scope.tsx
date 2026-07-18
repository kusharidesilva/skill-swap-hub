"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export default function AppMotionScope({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith("/admin");

  return (
    <div className={isAdminRoute ? "contents" : "user-motion-scope contents"}>
      {children}
    </div>
  );
}
