"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { collection, getDocs, query, where } from "firebase/firestore";
import { resetPassword } from "@/lib/auth";
import { db } from "@/lib/firebase";

type Badge = {
  label: string;
  icon: "shield" | "cap";
};

const badges: Badge[] = [
  { label: "Verified student providers", icon: "shield" },
  { label: "Open for buyers", icon: "cap" },
];

// The flow switches from the email form to a clear sent-confirmation screen.
type Step = "recovery" | "sent";

const recoverySchema = z.object({
  email: z.string().email("Enter a valid email."),
});

type RecoveryValues = z.infer<typeof recoverySchema>;

export default function ForgotPasswordFlow() {
  const [step, setStep] = useState<Step>("recovery");
  const [sentEmail, setSentEmail] = useState("");
  const [serverError, setServerError] = useState("");
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RecoveryValues>({
    resolver: zodResolver(recoverySchema),
  });

  const onRecoverySubmit = async (data: RecoveryValues) => {
    setServerError("");
    try {
      const trimmedEmail = data.email.trim();
      const normalizedEmail = trimmedEmail.toLowerCase();

      const emailQueries =
        normalizedEmail === trimmedEmail
          ? [
              query(
                collection(db, "users"),
                where("email", "==", normalizedEmail),
              ),
            ]
          : [
              query(
                collection(db, "users"),
                where("email", "==", trimmedEmail),
              ),
              query(
                collection(db, "users"),
                where("email", "==", normalizedEmail),
              ),
            ];

      let hasRegisteredUser = false;
      for (const userQuery of emailQueries) {
        const userSnapshot = await getDocs(userQuery);
        if (!userSnapshot.empty) {
          hasRegisteredUser = true;
          break;
        }
      }

      if (!hasRegisteredUser) {
        setServerError(
          "No Skill Swap Hub account was found for that email.",
        );
        return;
      }

      // Firebase owns the secure reset link and password update page.
      await resetPassword(trimmedEmail);
      setSentEmail(trimmedEmail);
      setStep("sent");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      if (msg.includes("user-not-found")) {
        setServerError(
          "No Skill Swap Hub account was found for that email.",
        );
      } else {
        setServerError(msg);
      }
    }
  };

  return (
    <main className="auth-gradient-animate relative min-h-screen bg-[linear-gradient(140deg,#eefdf8_0%,#dff3ff_44%,#f8fbff_100%)]">
      <div className="auth-gradient-animate fixed inset-0 bg-[linear-gradient(120deg,rgba(20,184,166,0.16),rgba(37,99,235,0.12),rgba(255,255,255,0.22))]" aria-hidden="true" />
      <div className="relative z-10 mx-auto flex min-h-screen items-center justify-center px-4 py-6 sm:px-6 lg:py-10">
        <div className="grid w-full max-h-[90vh] max-w-xl overflow-y-auto rounded-3xl bg-white shadow-2xl lg:max-h-none lg:max-w-5xl lg:overflow-hidden lg:grid-cols-[1.05fr_0.95fr]">
          {/* Security guidance */}
          <section className="auth-gradient-animate relative hidden flex-col justify-between bg-linear-to-br from-[#2f66e7] via-[#1d7fe7] to-[#173b8f] px-10 py-12 text-white lg:flex">
            <div className="absolute inset-0 opacity-10">
              <div className="h-full w-full bg-[linear-gradient(120deg,rgba(255,255,255,0.15)_0%,rgba(255,255,255,0.02)_50%,transparent_100%)]" />
            </div>
            <div className="relative">
              <div className="text-lg font-semibold">Skill Swap Hub</div>
              <div className="mt-10">
                <h1 className="text-3xl font-semibold sm:text-4xl">
                  {step === "recovery"
                    ? "Master new skills through peer exchange."
                    : "Check your inbox."}
                </h1>
                <p className="mt-4 max-w-md text-sm text-white/80">
                  {step === "recovery"
                    ? "Use your account email to recover access to Skill Swap Hub."
                    : "A password reset link has been sent. Follow the link in your email to set a new password."}
                </p>
              </div>
            </div>
            <div className="relative mt-10 flex flex-wrap gap-3">
              {badges.map((badge) => (
                <span
                  key={badge.label}
                  className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20">
                    <BadgeIcon type={badge.icon} className="h-3 w-3" />
                  </span>
                  {badge.label}
                </span>
              ))}
            </div>
            <div className="relative mt-10 text-xs text-white/70">
              © 2026 by Skill Swap Hub | All Right Reserved
            </div>
          </section>

          {/* Recovery form or success message */}
          <section className="relative flex flex-col items-center justify-center bg-white px-5 py-8 sm:px-7 md:px-8 lg:items-stretch lg:px-12 lg:py-12">
            <Link
              href="/"
              aria-label="Close"
              className="absolute right-8 top-8 inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
            >
              <CloseIcon className="h-4 w-4" />
            </Link>

            {step === "recovery" ? (
              /* Email entry step */
              <div className="w-full max-w-md">
                <p className="mb-2 text-sm font-bold uppercase tracking-wide text-[#2b62e6] lg:hidden">
                  Recover your account
                </p>
                <h2 className="text-2xl font-semibold text-slate-900">
                  Account Recovery
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  Enter your account email and we will send you a link to
                  reset your password.
                </p>

                {serverError && (
                  <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 border border-red-200">
                    {serverError}
                  </div>
                )}

                <form
                  className="mt-8 space-y-5"
                  onSubmit={handleSubmit(onRecoverySubmit)}
                >
                  <div>
                    <label className="text-sm font-semibold text-slate-700">
                      Email
                    </label>
                    <div className="mt-2 flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2">
                      <MailIcon className="h-5 w-5 text-slate-400" />
                      <input
                        id="forgot-email"
                        type="email"
                        placeholder="name@example.com"
                        {...register("email")}
                        className="w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-2 text-xs text-red-500">
                        {errors.email.message}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-slate-400">
                      Use the same email you registered with.
                    </p>
                  </div>

                  <button
                    id="forgot-submit"
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full cursor-pointer rounded-lg bg-[#2b62e6] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1f55cc] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting ? "Sending…" : "Send Reset Link"}
                  </button>

                  <div className="text-center">
                    <Link href="/login" className="text-xs font-semibold text-[#0f4cbf]">
                      Back to login
                    </Link>
                  </div>
                </form>

                <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#0f4cbf]">
                      <ShieldIcon className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-slate-700">
                        Need more help?
                      </p>
                      <p className="text-xs text-slate-500">
                        If you no longer have access to your email, contact our
                        support team to verify your identity.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Email sent confirmation */
              <div className="w-full max-w-md">
                <p className="mb-2 text-sm font-bold uppercase tracking-wide text-[#2b62e6] lg:hidden">
                  Check your email
                </p>
                {/* Success badge */}
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 shadow-sm">
                  <MailCheckIcon className="h-7 w-7" />
                </div>

                {/* Headline */}
                <h2 className="mt-5 text-2xl font-semibold text-slate-900">
                  Reset link sent!
                </h2>

                {/* Success message card */}
                <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-200 p-4">
                  <div className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                      ✓
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-emerald-800">Password Reset Email Sent!</p>
                      <p className="mt-1 text-[11px] text-emerald-600">
                        We sent a reset link to{" "}
                        <span className="font-semibold">{sentEmail}</span>.
                        Check your inbox and click the link to create a new password.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Next steps */}
                <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 px-4 py-4 space-y-2 text-xs text-slate-600">
                  <p className="font-semibold text-slate-700 mb-1">What to do next:</p>
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 text-[#2b62e6]">1.</span>
                    <span>Open your email inbox for <span className="font-medium text-slate-800">{sentEmail}</span>.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 text-[#2b62e6]">2.</span>
                    <span>Click the <span className="font-medium text-slate-800">&quot;Reset Password&quot;</span> link in the email.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 text-[#2b62e6]">3.</span>
                    <span>Set your new password and log back in.</span>
                  </div>
                </div>

                {/* Spam notice */}
                <p className="mt-3 text-center text-[11px] text-slate-400">
                  Didn&apos;t receive it? Check your spam folder or{" "}
                  <button
                    type="button"
                    onClick={() => setStep("recovery")}
                    className="cursor-pointer font-semibold text-[#0f4cbf] hover:underline"
                  >
                    try a different email
                  </button>
                  .
                </p>

                {/* Actions */}
                <div className="mt-6 space-y-3">
                  <Link
                    href="/login"
                    className="block w-full cursor-pointer rounded-lg bg-[#2b62e6] px-4 py-2.5 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-[#1f55cc]"
                  >
                    Back to Login
                  </Link>
                  <button
                    type="button"
                    onClick={() => router.push("/")}
                    className="block w-full cursor-pointer rounded-lg border border-slate-200 px-4 py-2.5 text-center text-sm font-semibold text-slate-700 transition hover:border-slate-300"
                  >
                    Go to Homepage
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

// Small icons used by the recovery screens.

function BadgeIcon({
  type,
  className,
}: {
  type: Badge["icon"];
  className?: string;
}) {
  if (type === "cap") {
    return (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path d="M2 9l10-5 10 5-10 5-10-5z" />
        <path d="M6 12v4c0 1.1 2.7 2 6 2s6-.9 6-2v-4" />
      </svg>
    );
  }
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M12 3l7 3v6c0 4.1-2.8 7.7-7 9-4.2-1.3-7-4.9-7-9V6l7-3z" />
      <path d="M9.5 12.5l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
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
    </svg>
  );
}

function MailCheckIcon({ className }: { className?: string }) {
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
      <path d="M9.5 12.5l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M6 6l12 12" strokeLinecap="round" />
      <path d="M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}
