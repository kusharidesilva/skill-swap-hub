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
    <main className="flex min-h-screen items-center justify-center bg-white px-6 py-10">
      {step === "confirm" ? (
        <section className="w-full max-w-[390px] rounded-xl border border-[#d7dbe8] bg-white p-6 shadow-[0_28px_60px_rgba(15,23,42,0.18)]">
          <div className="flex items-center gap-2 text-[#d93939]">
            <SignOutIcon className="h-5 w-5" />
            <h1 className="text-xl font-bold">Sign Out</h1>
          </div>
          <p className="mt-3 text-sm font-medium leading-6 text-[#6f7483]">
            Are you sure you want to sign out? You will need to log back in to manage the platform.
          </p>

          <div className="mt-5 flex items-center gap-3 rounded-lg border border-[#dfe2f1] bg-[#f1f2ff] px-4 py-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e0e8ff] text-sm font-bold text-[#2f66e7]">
              {displayName.charAt(0).toUpperCase()}
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
              className="flex h-11 items-center justify-center rounded-md border border-[#bfc4d2] bg-white text-sm font-bold text-[#343947] transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={loading}
              className="flex h-11 items-center justify-center rounded-md bg-[#0957c9] text-sm font-bold text-white shadow-sm transition hover:bg-[#0649ab] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing Out..." : "Sign Out"}
            </button>
          </div>
        </section>
      ) : (
        <section className="relative flex h-[330px] w-full max-w-[370px] flex-col items-center justify-center rounded-[24px] bg-[#f0f0ff] text-center">
          <Link
            href="/admin/login"
            aria-label="Close"
            className="absolute right-6 top-5 text-lg font-bold text-[#4d5260] transition hover:text-[#20242e]"
          >
            x
          </Link>
          <div className="flex h-[68px] w-[68px] items-center justify-center rounded-full bg-[#2f66e7] text-white">
            <CheckIcon className="h-10 w-10" />
          </div>
          <h2 className="mt-6 text-[22px] font-bold leading-8 text-[#272b35]">
            Sign Out
            <br />
            Successfully!
          </h2>
          <Link
            href="/admin/login"
            className="mt-7 inline-flex h-10 items-center justify-center rounded-md bg-[#2f66e7] px-5 text-sm font-semibold text-white transition hover:bg-[#2356cb]"
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

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="8" />
      <path d="m8.8 12.2 2.2 2.2 4.4-4.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
