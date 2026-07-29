"use client";

import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { accountNeedsEmailVerification, signOut } from "@/lib/auth";
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
  const isSuspended = userProfile?.accountStatus === "suspended";

  const redirectTo = (href: string) => {
    if (typeof window === "undefined") return;
    window.location.replace(href);
  };

  useEffect(() => {
    // These checks run in order so the user always lands on the most useful next step.
    if (loading) return;

    // Guests must sign in before any protected content is shown.
    if (!firebaseUser) {
      redirectTo("/login");
      return;
    }

    if (userProfile?.providerVerificationStatus === "rejected") {
      void signOut().finally(() => {
        redirectTo("/login?reason=verification-rejected");
      });
      return;
    }

    if (
      isPendingAdminVerificationStatus(userProfile?.accountStatus) ||
      userProfile?.providerVerificationStatus === "pending"
    ) {
      redirectTo("/pending-verification");
      return;
    }

    if (userProfile?.accountStatus === "suspended") {
      return;
    }

    // Non-student accounts still need to prove ownership of their email address.
    if (
      userProfile &&
      accountNeedsEmailVerification(userProfile.accountType) &&
      !firebaseUser.emailVerified
    ) {
      redirectTo("/verify-email");
      return;
    }

    // Check role access only after the Firestore profile has arrived.
    if (requiredRole && userProfile) {
      const role = userProfile.role;

      if (role === "admin") {
        redirectTo("/admin");
        return;
      }

      // Dual-role users can open everything, while providers may also browse buyer pages.
      const hasAccess =
        role === "both" ||
        role === requiredRole ||
        role === "provider";

      if (!hasAccess) {
        redirectTo(dashboardHref(role));
      }
    }
  }, [loading, firebaseUser, userProfile, requiredRole]);

  // Keep protected content hidden while Firebase loads or a redirect is happening.
  if (
    loading ||
    !firebaseUser ||
    userProfile?.providerVerificationStatus === "rejected" ||
    isSuspended ||
    isPendingAdminVerificationStatus(userProfile?.accountStatus) ||
    userProfile?.providerVerificationStatus === "pending" ||
    (userProfile &&
      accountNeedsEmailVerification(userProfile.accountType) &&
      !firebaseUser.emailVerified)
  ) {
    if (isSuspended && userProfile) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#f5f7ff] px-4">
          <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.12)]">
            <p className="text-xs font-bold uppercase tracking-[0.26em] text-red-600">
              Account Suspended
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-900">
              {userProfile.suspensionTitle?.trim() || "Your access is currently blocked"}
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              {userProfile.suspensionReason?.trim() ||
                userProfile.adminSuspensionReason?.trim() ||
                "This account was suspended by an admin. Please contact support for more details."}
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a
                href="mailto:admin@skillswaphub.lk"
                className="inline-flex h-12 flex-1 items-center justify-center rounded-xl bg-[#2b62e6] px-5 text-sm font-semibold text-white transition hover:bg-[#1f55cc]"
              >
                Contact Admin
              </a>
              <button
                type="button"
                onClick={() => void signOut().finally(() => redirectTo("/login"))}
                className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      );
    }

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
