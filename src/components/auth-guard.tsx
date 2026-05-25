"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import type { Role } from "@/lib/role-routes";

interface AuthGuardProps {
  /** The role this page is restricted to. Pass undefined to allow any logged-in user. */
  requiredRole?: Role;
  children: React.ReactNode;
}

/**
 * Client-side route guard.
 * – If the user is not logged in → redirect to /login
 * – If the user's email is not verified → redirect to /verify-email
 * – If requiredRole is set and the user's role doesn't match → redirect to their home
 */
export default function AuthGuard({ requiredRole, children }: AuthGuardProps) {
  const { firebaseUser, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    // 1. Not authenticated at all
    if (!firebaseUser) {
      router.replace("/login");
      return;
    }

    // 2. Email not verified yet
    if (!firebaseUser.emailVerified) {
      router.replace("/verify-email");
      return;
    }

    // 3. Role mismatch (only if requiredRole is set and profile is loaded)
    if (requiredRole && userProfile) {
      const role = userProfile.role;
      // "both" users can access either buyer or provider pages
      const hasAccess =
        role === "both" || role === requiredRole;
      if (!hasAccess) {
        router.replace(`/home/${role}`);
      }
    }
  }, [loading, firebaseUser, userProfile, requiredRole, router]);

  // Show nothing while redirecting
  if (loading || !firebaseUser || !firebaseUser.emailVerified) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f7ff]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#2b62e6] border-t-transparent" />
          <p className="text-sm text-slate-500">Loading…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
