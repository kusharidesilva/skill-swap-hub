"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useCallback } from "react";
import { resendVerificationEmail } from "@/lib/auth";
import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/firebase";
import { dashboardHref, homeHref } from "@/lib/role-routes";

interface Props {
  searchParams?: { from?: string; registered?: string };
}

export default function VerifyEmailPage({ searchParams }: Props) {
  const isProvider = searchParams?.from === "provider";
  const isRegistered = searchParams?.registered === "true";
  const router = useRouter();
  const { firebaseUser } = useAuth();

  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [verifySuccess, setVerifySuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Reload the account because verification may have happened in another browser tab.
  const handleCheckVerification = useCallback(async () => {
    setChecking(true);
    setErrorMsg("");
    try {
      // Firebase keeps a cached user until reload is requested.
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setErrorMsg("No active session. Please log in again.");
        setChecking(false);
        return;
      }
      await currentUser.reload();
      if (currentUser.emailVerified) {
        setVerifySuccess(true);
        setTimeout(() => {
          router.push(isProvider ? homeHref("provider") : dashboardHref("buyer"));
        }, 1500);
      } else {
        setErrorMsg(
          "Email not yet verified. Please click the link in your inbox first."
        );
      }
    } catch {
      setErrorMsg("Could not check verification status. Please try again.");
    } finally {
      setChecking(false);
    }
  }, [isProvider, router]);

  // Resending is rate-limited in the UI to avoid accidental repeated emails.
  const handleResend = async () => {
    setResending(true);
    setResendSuccess(false);
    setErrorMsg("");
    try {
      await resendVerificationEmail();
      setResendSuccess(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to resend email.";
      setErrorMsg(msg);
    } finally {
      setResending(false);
    }
  };

  return (
    <main className="relative min-h-screen bg-[#f6f4fb]">
      <div className="relative z-10 mx-auto flex min-h-screen items-center justify-center px-6 py-10">
        <div className="w-full max-w-lg text-center">
          {/* Icon */}
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#e8f5f2] text-[#0f8a6b]">
            <MailIcon className="h-7 w-7" />
          </div>

          <h1 className="mt-4 text-2xl font-semibold text-slate-900">
            Verify Your University Email
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            We sent a verification link to{" "}
            {firebaseUser?.email ? (
              <span className="font-semibold text-slate-700">
                {firebaseUser.email}
              </span>
            ) : (
              "your university email"
            )}
            . Click the link in the email to activate your account, then return
            here.
          </p>

          {/* Main card */}
          <div className="mt-8 rounded-2xl bg-white px-6 py-6 shadow-[0_20px_60px_-45px_rgba(15,23,42,0.45)]">
            <div className="space-y-3">
              {/* Registration Success Banner */}
              {isRegistered && !verifySuccess && !resendSuccess && (
                <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-left shadow-xs animate-fadeIn">
                  <div className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 text-xs">
                      🎉
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-emerald-800">Account Created Successfully!</p>
                      <p className="mt-1 text-[11px] text-emerald-600">
                        Welcome to Skill Swap Hub! We have sent a verification link to your email. Click it to get started.
                      </p>
                      <p className="mt-2 rounded-lg bg-[#ecf9ff] px-2.5 py-2 text-[11px] font-medium text-[#137c8a]">
                        If you do not see the email in your inbox, please check your junk or spam folder too.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Verification Success Banner */}
              {verifySuccess && (
                <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-left shadow-xs animate-pulse">
                  <div className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 text-xs">
                      ✓
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-emerald-800">Verification Successful!</p>
                      <p className="mt-1 text-[11px] text-emerald-600">
                        Welcome aboard. Redirecting to your dashboard...
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Error */}
              {errorMsg && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 border border-red-200">
                  {errorMsg}
                </p>
              )}

              {/* Resend success */}
              {resendSuccess && (
                <div className="mb-4 rounded-xl bg-[#ecf9ff] border border-[#c8e6ec] p-4 text-left shadow-xs">
                  <div className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-[#137c8a] text-xs">
                      ✉️
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-[#137c8a]">Verification Link Resent!</p>
                      <p className="mt-1 text-[11px] text-[#137c8a]/80">
                        A new link has been successfully delivered. Please check your inbox or spam folder.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Primary CTA: I've verified */}
              <button
                id="check-verification-btn"
                type="button"
                onClick={handleCheckVerification}
                disabled={checking}
                className="w-full rounded-lg bg-[#3b56d8] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#2e47d8] disabled:opacity-60"
              >
                {checking ? "Checking…" : "I've Verified — Continue"}
              </button>

              {/* Resend */}
              <button
                id="resend-email-btn"
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="w-full text-xs font-semibold text-[#3b56d8] py-1 hover:underline disabled:opacity-60"
              >
                {resending ? "Resending…" : "Resend Verification Email"}
              </button>

              <Link
                href="/login"
                className="block text-xs font-semibold text-slate-500 hover:text-slate-700"
              >
                Back to Login
              </Link>
            </div>
          </div>

          {/* Info banner */}
          <div className="mt-5 rounded-2xl border border-[#c8e6ec] bg-[#ecf9ff] px-4 py-3 text-xs text-[#137c8a]">
            <div className="flex items-start gap-2">
              <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[#137c8a]">
                <ShieldIcon className="h-3 w-3" />
              </span>
              <span>
                This step helps keep Skill Swap Hub limited to real university
                students. Securing our peer-to-peer system.
              </span>
            </div>
          </div>

          {/* Footer image */}
          <div className="mt-6 overflow-hidden rounded-2xl">
            <Image
              src="/img/02.jpg"
              alt="Students learning together"
              width={520}
              height={300}
              className="h-auto w-full object-cover"
            />
          </div>
        </div>
      </div>
    </main>
  );
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M4 6h16v12H4z" />
      <path d="M4 7l8 6 8-6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 13l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M12 3l7 3v6c0 4.1-2.8 7.7-7 9-4.2-1.3-7-4.9-7-9V6l7-3z" />
      <path
        d="M9.5 12.5l2 2 4-4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
