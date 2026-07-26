"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { signOut } from "@/lib/auth";

type Step = "confirm" | "success";

export default function AdminSignOutPage() {
  const router = useRouter();
  const { firebaseUser, userProfile, loading: authLoading } = useAuth();
  const [step, setStep] = useState<Step>("confirm");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const displayName = userProfile?.name || firebaseUser?.displayName || "Admin User";
  const displayEmail = userProfile?.email || firebaseUser?.email || "admin account";

  useEffect(() => {
    if (!authLoading && !firebaseUser && step === "confirm") {
      router.replace("/admin/login");
    }
  }, [authLoading, firebaseUser, router, step]);

  const handleSignOut = async () => {
    setLoading(true);
    setErrorMsg("");

    try {
      await signOut();
      setStep("success");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Sign-out failed.";
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="admin-interaction-scope relative flex min-h-screen items-center justify-center overflow-hidden bg-[linear-gradient(135deg,#d7f0ff_0%,#eafcf5_42%,#f6fbff_100%)] px-6 py-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.2),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(20,184,166,0.18),transparent_30%)]"
      />
      {step === "confirm" ? (
        <section className="relative w-full max-w-[410px] rounded-[28px] border border-white/70 bg-white/88 p-6 shadow-[0_28px_60px_rgba(15,23,42,0.16)] backdrop-blur-md">
          <div className="flex items-center gap-2 text-[#0b7c8f]">
            <SignOutIcon className="h-5 w-5" />
            <h1 className="text-xl font-bold">Sign Out</h1>
          </div>
          <p className="mt-3 text-sm font-medium leading-6 text-[#6f7483]">
            Are you sure you want to sign out? You will need to log back in to manage the platform.
          </p>

          <div className="mt-5 flex items-center gap-3 rounded-2xl border border-[#d9ebe7] bg-[linear-gradient(135deg,#eef6ff_0%,#eefcf8_100%)] px-4 py-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/80 bg-white p-1 shadow-sm">
              <img
                src="/img/Skill Swap Hub Logo icon.png"
                alt="Skill Swap Hub logo"
                className="h-full w-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-[#303542]">{displayName}</p>
              <p className="truncate text-xs font-medium text-[#717887]">{displayEmail}</p>
            </div>
          </div>

          {errorMsg ? (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
              {errorMsg}
            </div>
          ) : null}

          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => router.push("/admin")}
              disabled={loading}
              className="flex h-11 cursor-pointer items-center justify-center rounded-xl border border-[#c8d8df] bg-white/90 text-sm font-bold text-[#343947] transition hover:bg-cyan-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={loading}
              className="flex h-11 cursor-pointer items-center justify-center rounded-xl bg-[linear-gradient(135deg,#2563eb,#0ea5a6)] text-sm font-bold text-white shadow-[0_16px_34px_rgba(37,99,235,0.24)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing Out..." : "Sign Out"}
            </button>
          </div>
        </section>
      ) : (
        <section className="relative flex h-[330px] w-full max-w-[380px] flex-col items-center justify-center rounded-[28px] border border-white/70 bg-white/80 text-center shadow-[0_24px_70px_rgba(15,23,42,0.14)] backdrop-blur-md">
          <Link
            href="/admin/login"
            aria-label="Close"
            className="absolute right-6 top-5 text-lg font-bold text-[#4d5260] transition hover:text-[#20242e]"
          >
            x
          </Link>
          <div className="flex h-[68px] w-[68px] items-center justify-center overflow-hidden rounded-full border border-white/80 bg-white p-2 shadow-[0_18px_38px_rgba(37,99,235,0.16)]">
            <img
              src="/img/Skill Swap Hub Logo icon.png"
              alt="Skill Swap Hub logo"
              className="h-full w-full object-contain"
            />
          </div>
          <h2 className="mt-6 text-[22px] font-bold leading-8 text-[#272b35]">
            Sign Out
            <br />
            Successfully!
          </h2>
          <Link
            href="/admin/login"
            className="mt-7 inline-flex cursor-pointer h-10 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#2563eb,#0ea5a6)] px-5 text-sm font-semibold text-white shadow-[0_16px_34px_rgba(37,99,235,0.22)] transition hover:brightness-105"
          >
            Back to Admin Login
          </Link>
        </section>
      )}
    </main>
  );
}

function SignOutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10 17 15 12 10 7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 12H3" strokeLinecap="round" />
      <path d="M21 4v16" strokeLinecap="round" />
    </svg>
  );
}
