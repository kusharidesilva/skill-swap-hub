"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { accountNeedsEmailVerification } from "@/lib/auth";
import { isPendingAdminVerificationStatus } from "@/lib/platform";
import { dashboardHref, type Role } from "@/lib/role-routes";

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
    // These checks run in order so the user always lands on the most useful next step.
    if (loading) return;

    // Guests must sign in before any protected content is shown.
    if (!firebaseUser) {
      router.replace("/login");
      return;
    }

    if (
      isPendingAdminVerificationStatus(userProfile?.accountStatus) ||
      userProfile?.providerVerificationStatus === "pending"
    ) {
      router.replace("/pending-verification");
      return;
    }

    // Non-student accounts still need to prove ownership of their email address.
    if (
      userProfile &&
      accountNeedsEmailVerification(userProfile.accountType) &&
      !firebaseUser.emailVerified
    ) {
      router.replace("/verify-email");
      return;
    }

    // Check role access only after the Firestore profile has arrived.
    if (requiredRole && userProfile) {
      const role = userProfile.role;

      if (role === "admin") {
        router.replace("/admin");
        return;
      }

      // Dual-role users can open everything, while providers may also browse buyer pages.
      const hasAccess =
        role === "both" ||
        role === requiredRole ||
        role === "provider";

      if (!hasAccess) {
        router.replace(dashboardHref(role));
      }
    }
  }, [loading, firebaseUser, userProfile, requiredRole, router]);

  // Keep protected content hidden while Firebase loads or a redirect is happening.
  if (
    loading ||
    !firebaseUser ||
    isPendingAdminVerificationStatus(userProfile?.accountStatus) ||
    userProfile?.providerVerificationStatus === "pending" ||
    (userProfile &&
      accountNeedsEmailVerification(userProfile.accountType) &&
      !firebaseUser.emailVerified)
  ) {
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
