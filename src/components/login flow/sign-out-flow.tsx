"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth";
import { useAuth } from "@/context/AuthContext";

type Step = "confirm" | "success";

export default function SignOutFlow() {
  const [step, setStep] = useState<Step>("confirm");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();
  const { firebaseUser, userProfile } = useAuth();

  const displayName = userProfile?.name ?? firebaseUser?.displayName ?? "User";
  const displayEmail = userProfile?.email ?? firebaseUser?.email ?? "";

  const handleSignOut = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      await signOut();
      setStep("success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Sign-out failed.";
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen bg-[#f5f7ff]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#e6edff_0%,transparent_55%)]" />
      <div className="absolute inset-x-0 top-0 h-36 bg-linear-to-b from-[#eaf0ff] to-transparent" />
      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-10">
        {step === "confirm" ? (
          <ConfirmCard
            name={displayName}
            email={displayEmail}
            loading={loading}
            errorMsg={errorMsg}
            onCancel={() => router.back()}
            onSignOut={handleSignOut}
          />
        ) : (
          <SuccessCard />
        )}
      </div>
    </main>
  );
}

// Ask for confirmation before ending the Firebase session.

type ConfirmCardProps = {
  name: string;
  email: string;
  loading: boolean;
  errorMsg: string;
  onCancel: () => void;
  onSignOut: () => void;
};

function ConfirmCard({
  name,
  email,
  loading,
  errorMsg,
  onCancel,
  onSignOut,
}: ConfirmCardProps) {
  return (
    <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-[0_24px_60px_-32px_rgba(20,24,64,0.45)]">
      <div className="flex items-start gap-3">
        <span className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-500">
          <ArrowIcon className="h-4 w-4" />
        </span>
        <div>
          <p className="text-sm font-semibold text-red-500">Sign Out</p>
          <h1 className="text-base font-semibold text-slate-900">
            Are you sure you want to sign out?
          </h1>
        </div>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        You will need to log back in to access your skills and matches.
      </p>

      {/* User info strip */}
      <div className="mt-4 flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e8eeff] text-sm font-semibold text-[#2b62e6]">
          {name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">{name}</p>
          <p className="text-xs text-slate-500">{email}</p>
        </div>
      </div>

      {errorMsg && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 border border-red-200">
          {errorMsg}
        </p>
      )}

      <div className="mt-5 grid grid-cols-2 gap-3">
        <button
          id="sign-out-cancel"
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          id="sign-out-confirm"
          type="button"
          onClick={onSignOut}
          disabled={loading}
          className="rounded-lg bg-[#3855f3] px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#2e47d8] disabled:opacity-60"
        >
          {loading ? "Signing out…" : "Sign Out"}
        </button>
      </div>
    </div>
  );
}

// Confirm that local authentication state has been cleared.

function SuccessCard() {
  return (
    <div className="w-full max-w-4xl rounded-3xl bg-white p-6 shadow-[0_30px_80px_-40px_rgba(23,32,74,0.45)] md:p-10">
      <div className="grid gap-8 md:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-slate-100 bg-[#f8f9ff] p-6">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <DoorIcon className="h-5 w-5" />
          </div>
          <h2 className="mt-4 text-base font-semibold text-slate-900">
            Securely Disconnected
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Your session has been safely closed. All your skill swaps and
            messages are protected until your next visit.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-100 bg-white px-4 py-3">
              <p className="text-xs font-semibold text-slate-800">
                Data Encrypted
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Private data stays secure and locked.
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-white px-4 py-3">
              <p className="text-xs font-semibold text-slate-800">Fast Reload</p>
              <p className="mt-1 text-xs text-slate-500">
                Pick up where you left off quickly.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-center">
          <span className="inline-flex w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
            Success
          </span>
          <h3 className="mt-3 text-xl font-semibold text-slate-900">
            See you soon!
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            You have been successfully signed out. Thank you for being part of
            the Skill Swap Hub community.
          </p>

          <div className="mt-6 space-y-3">
            <Link
              href="/login"
              className="block w-full rounded-lg bg-[#3855f3] px-4 py-2.5 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-[#2e47d8]"
            >
              Log In Again
            </Link>
            <Link
              href="/"
              className="block w-full rounded-lg border border-slate-200 px-4 py-2.5 text-center text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
            >
              Return to Homepage
            </Link>
          </div>

          <div className="mt-6 flex items-center gap-4 text-slate-400">
            <span className="text-[10px] uppercase tracking-[0.2em]">
              Connect with us
            </span>
            <div className="flex gap-3">
              <IconButton label="Twitter" icon={<TwitterIcon className="h-4 w-4" />} />
              <IconButton label="LinkedIn" icon={<LinkedInIcon className="h-4 w-4" />} />
              <IconButton label="GitHub" icon={<GitHubIcon className="h-4 w-4" />} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Small reusable pieces shared by both cards.

function IconButton({ label, icon }: { label: string; icon: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition hover:border-slate-300 hover:text-slate-600"
    >
      {icon}
    </button>
  );
}

// Icons used by the sign-out flow.

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M6 12h12" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DoorIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M5 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5z" />
      <path d="M9 12h4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 7h4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.9 7.3c0 .2 0 .5-.1.7-.7 7.1-5.1 12.2-11.8 12.2-2.3 0-4.4-.7-6.2-1.9h.9c1.9 0 3.7-.6 5.1-1.7-1.8 0-3.3-1.2-3.8-2.8.3.1.7.1 1 .1.4 0 .8-.1 1.1-.2-1.9-.4-3.3-2.1-3.3-4.1v-.1c.6.3 1.2.5 1.9.5-1.1-.8-1.8-2-1.8-3.5 0-.8.2-1.5.6-2.1 2.1 2.6 5.2 4.3 8.7 4.5-.1-.3-.1-.6-.1-.9 0-2.1 1.7-3.9 3.9-3.9 1.1 0 2.1.5 2.8 1.3.9-.2 1.8-.5 2.6-1-.3.9-.9 1.7-1.7 2.2.8-.1 1.6-.3 2.3-.6-.5.8-1.1 1.5-1.9 2z" />
    </svg>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M4.98 3.5a2.48 2.48 0 1 1-.01 4.96 2.48 2.48 0 0 1 .01-4.96z" />
      <path d="M4 8.9h2.9V20H4z" />
      <path d="M9.3 8.9h2.8v1.5h.1c.4-.8 1.5-1.7 3.2-1.7 3.5 0 4.1 2.3 4.1 5.2V20h-2.9v-5.2c0-1.2 0-2.8-1.7-2.8-1.7 0-1.9 1.3-1.9 2.7V20H9.3z" />
    </svg>
  );
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.2-3.4-1.2-.4-1.1-1.1-1.4-1.1-1.4-.9-.6.1-.6.1-.6 1 .1 1.6 1.1 1.6 1.1.9 1.6 2.5 1.1 3.1.8.1-.6.3-1.1.6-1.3-2.2-.2-4.5-1.1-4.5-5.1 0-1.1.4-2 1-2.7-.1-.2-.4-1.3.1-2.7 0 0 .9-.3 2.8 1 .8-.2 1.7-.3 2.6-.3.9 0 1.8.1 2.6.3 1.9-1.3 2.8-1 2.8-1 .5 1.4.2 2.5.1 2.7.6.7 1 1.6 1 2.7 0 4-2.3 4.9-4.5 5.1.3.3.7 1 .7 2.1V21c0 .3.2.6.7.5A10 10 0 0 0 12 2z" />
    </svg>
  );
}
