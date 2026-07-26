"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getPostLoginRedirect, getUserProfile, signOut } from "@/lib/auth";
import { isPendingAdminVerificationStatus } from "@/lib/platform";

interface Props {
  searchParams?: { registered?: string };
}

export default function PendingVerificationPage({ searchParams }: Props) {
  const isRegistered = searchParams?.registered === "true";
  const router = useRouter();
  const { firebaseUser, userProfile, loading, refreshProfile } = useAuth();
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState("");
  const contactEmail = firebaseUser?.email || userProfile?.email || "your email";

  useEffect(() => {
    if (loading || !firebaseUser || !userProfile) return;

    if (userProfile.providerVerificationStatus === "rejected") {
      void signOut().finally(() => {
        router.replace("/login?reason=verification-rejected");
      });
      return;
    }

    if (
      !isPendingAdminVerificationStatus(userProfile.accountStatus) &&
      userProfile.providerVerificationStatus !== "pending"
    ) {
      getPostLoginRedirect(userProfile, firebaseUser.uid)
        .then((redirectPath) => router.replace(redirectPath))
        .catch(() => {});
    }
  }, [firebaseUser, loading, router, userProfile]);

  const handleCheckStatus = async () => {
    if (!firebaseUser) {
      router.push("/login");
      return;
    }

    setChecking(true);
    setMessage("");

    try {
      await refreshProfile();
      const profile = await getUserProfile(firebaseUser.uid);

      if (!profile) {
        setMessage("Profile not found. Please contact support.");
        return;
      }

      if (profile.providerVerificationStatus === "approved") {
        setMessage("Approved. Redirecting you to your provider area...");
        const redirectPath = await getPostLoginRedirect(profile, firebaseUser.uid);
        setTimeout(() => {
          router.push(redirectPath);
        }, 900);
        return;
      }

      if (profile.providerVerificationStatus === "rejected") {
        await signOut();
        router.replace("/login?reason=verification-rejected");
        return;
      }

      setMessage("Still pending. Please wait until the admin confirms that you are a student.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not check status.");
    } finally {
      setChecking(false);
    }
  };

  if (loading) {
    return (
      <main className="auth-gradient-animate flex min-h-screen items-center justify-center bg-[linear-gradient(130deg,#e7fff5_0%,#dff4ff_52%,#f7fbff_100%)]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#0f8a6b] border-t-transparent" />
          <p className="text-sm text-slate-500">Loading your verification request...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="auth-gradient-animate relative min-h-screen overflow-hidden bg-[linear-gradient(125deg,#e8fff5_0%,#e3f6ff_44%,#f7fbff_72%,#dbfff2_100%)]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(15,138,107,0.22),transparent_28%),radial-gradient(circle_at_82%_22%,rgba(43,98,230,0.20),transparent_30%),radial-gradient(circle_at_50%_88%,rgba(119,239,224,0.20),transparent_34%)]"
      />

      <div className="relative z-10 mx-auto flex min-h-screen flex-col items-center px-6 py-10">
        <div className="mt-4 flex justify-center sm:mt-8">
          <div className="inline-flex items-center gap-3 rounded-full border border-white/60 bg-white/45 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#0f766e] shadow-[0_18px_44px_-30px_rgba(15,23,42,0.55)] backdrop-blur-2xl">
            <span className="relative flex h-5 w-5 items-center justify-center">
              <span className="absolute h-5 w-5 animate-ping rounded-full bg-emerald-300/60" />
              <span className="relative h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_18px_rgba(16,185,129,0.85)]" />
            </span>
            Live Review
          </div>
        </div>

        <section className="mt-10 w-full max-w-md rounded-[28px] border border-white/60 bg-white/38 px-7 py-8 text-center shadow-[0_26px_90px_-48px_rgba(15,23,42,0.65)] backdrop-blur-2xl sm:px-9">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/70 text-[#0f8a6b] shadow-[0_18px_42px_-28px_rgba(15,138,107,0.7)]">
            <ClockBadgeIcon className="h-7 w-7" />
          </div>

          {isRegistered ? (
            <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-[#0f766e]">
              Request sent successfully
            </p>
          ) : null}

          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
            Waiting for admin approval
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            Please wait while the admin reviews your student proof. Approval can take up to{" "}
            <span className="font-bold text-[#0f4cbf]">48 hours</span>.
          </p>
          <p className="mt-3 text-xs leading-5 text-slate-600">
            Once your account is verified, we will send an email to{" "}
            <span className="font-semibold text-slate-900">{contactEmail}</span> and welcome you to use
            Skill Swap Hub.
          </p>

          {message ? (
            <p className="mt-5 rounded-2xl border border-white/70 bg-white/55 px-4 py-3 text-xs font-semibold text-[#137c8a]">
              {message}
            </p>
          ) : null}

          <div className="mt-7 flex justify-center">
            <button
              type="button"
              onClick={handleCheckStatus}
              disabled={checking}
              className="inline-flex h-11 w-full max-w-[240px] cursor-pointer items-center justify-center rounded-xl bg-[#2b62e6] px-5 text-sm font-semibold text-white shadow-[0_18px_34px_-22px_rgba(43,98,230,0.9)] transition hover:bg-[#1f55cc] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {checking ? "Checking..." : "Check Status"}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

function ClockBadgeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l2.5 2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
