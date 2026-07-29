"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { dashboardHref } from "@/lib/role-routes";

export default function DashboardPage() {
  const router = useRouter();
  const { userProfile, loading } = useAuth();

  useEffect(() => {
    if (loading || !userProfile || userProfile.role === "admin") return;
    router.replace(dashboardHref(userProfile.role));
  }, [loading, router, userProfile]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f7ff]">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#2b62e6] border-t-transparent" />
        <p className="text-sm text-slate-500">Opening your dashboard...</p>
      </div>
    </div>
  );
}
