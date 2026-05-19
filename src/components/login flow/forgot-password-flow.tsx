"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

type Badge = {
  label: string;
  icon: "shield" | "cap";
};

const badges: Badge[] = [
  { label: "Verified student Emails", icon: "shield" },
  { label: "University Exclusive", icon: "cap" },
];

type Step = "recovery" | "reset";

const recoverySchema = z.object({
  email: z.string().email("Enter a valid university email."),
});

const resetSchema = z
  .object({
    email: z.string().email("Enter a valid university email."),
    newPassword: z.string().min(6, "Password must be at least 6 characters."),
    confirmPassword: z.string().min(6, "Password must be at least 6 characters."),
    remember: z.boolean().optional(),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

type RecoveryValues = z.infer<typeof recoverySchema>;
type ResetValues = z.infer<typeof resetSchema>;

export default function ForgotPasswordFlow() {
  const [step, setStep] = useState<Step>("recovery");
  const router = useRouter();
  const {
    register: registerRecovery,
    handleSubmit: handleRecoverySubmit,
    formState: { errors: recoveryErrors },
  } = useForm<RecoveryValues>({
    resolver: zodResolver(recoverySchema),
  });
  const {
    register: registerReset,
    handleSubmit: handleResetSubmit,
    formState: { errors: resetErrors },
  } = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { remember: false },
  });

  const onRecoverySubmit = () => {
    setStep("reset");
  };

  const onResetSubmit = () => {
    router.push("/verify-email?from=buyer");
  };

  return (
    <main className="relative min-h-screen bg-white">
      <div className="fixed inset-0 bg-black/20" aria-hidden="true" />
      <div className="relative z-10 mx-auto flex min-h-screen items-center justify-center px-6 py-10">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl lg:grid-cols-[1.05fr_0.95fr]">
          <section className="relative flex flex-col justify-between bg-linear-to-br from-[#2b62e6] via-[#1f5ad7] to-[#0e3a9e] px-10 py-12 text-white">
            <div className="absolute inset-0 opacity-10">
              <div className="h-full w-full bg-[linear-gradient(120deg,rgba(255,255,255,0.15)_0%,rgba(255,255,255,0.02)_50%,transparent_100%)]" />
            </div>
            <div className="relative">
              <div className="text-lg font-semibold">Skill Swap Hub</div>
              <div className="mt-10">
                <h1 className="text-3xl font-semibold sm:text-4xl">
                  {step === "recovery"
                    ? "Master new skills through peer exchange."
                    : "Elevate your academic journey through peer-to-peer exchange."}
                </h1>
                <p className="mt-4 max-w-md text-sm text-white/80">
                  {step === "recovery"
                    ? "Connect with fellow students to trade knowledge. Teach what you excel at, learn what you are curious about, and build a stronger community."
                    : "Join a trusted student-only platform to share skills, request support, and connect with verified university students."}
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

          <section className="relative flex flex-col justify-center bg-white px-8 py-12 sm:px-12">
            <Link
              href="/"
              aria-label="Close"
              className="absolute right-8 top-8 inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
            >
              <CloseIcon className="h-4 w-4" />
            </Link>

            {step === "recovery" ? (
              <div className="max-w-md">
                <h2 className="text-2xl font-semibold text-slate-900">
                  Account Recovery
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  Enter your university email and we will send you a verification code to reset your password.
                </p>

                <form
                  className="mt-8 space-y-5"
                  onSubmit={handleRecoverySubmit(onRecoverySubmit)}
                >
                  <div>
                    <label className="text-sm font-semibold text-slate-700">
                      University Email
                    </label>
                    <div className="mt-2 flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2">
                      <MailIcon className="h-5 w-5 text-slate-400" />
                      <input
                        type="email"
                        placeholder="mail@uni.ac.lk"
                        {...registerRecovery("email")}
                        className="w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
                      />
                    </div>
                    {recoveryErrors.email && (
                      <p className="mt-2 text-xs text-red-500">{recoveryErrors.email.message}</p>
                    )}
                    <p className="mt-2 text-xs text-slate-400">
                      Must be a valid institutional email address.
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-lg bg-[#2b62e6] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1f55cc]"
                  >
                    Reset Your Password
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
                        If you no longer have access to your email, contact our support team to verify your identity.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="max-w-md">
                <h2 className="text-2xl font-semibold text-slate-900">
                  Welcome back
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  Please enter your university credentials to continue
                </p>

                <form
                  className="mt-8 space-y-5"
                  onSubmit={handleResetSubmit(onResetSubmit)}
                >
                  <div>
                    <label className="text-sm font-semibold text-slate-700">
                      University Email
                    </label>
                    <div className="mt-2 flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2">
                      <MailIcon className="h-5 w-5 text-slate-400" />
                      <input
                        type="email"
                        placeholder="student.name@uom.ac.lk"
                        {...registerReset("email")}
                        className="w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
                      />
                    </div>
                    {resetErrors.email && (
                      <p className="mt-2 text-xs text-red-500">{resetErrors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-slate-700">
                      New Password
                    </label>
                    <div className="mt-2 flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2">
                      <LockIcon className="h-5 w-5 text-slate-400" />
                      <input
                        type="password"
                        placeholder="••••••••"
                        {...registerReset("newPassword")}
                        className="w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
                      />
                    </div>
                    {resetErrors.newPassword && (
                      <p className="mt-2 text-xs text-red-500">{resetErrors.newPassword.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-slate-700">
                      Confirm Password
                    </label>
                    <div className="mt-2 flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2">
                      <LockIcon className="h-5 w-5 text-slate-400" />
                      <input
                        type="password"
                        placeholder="••••••••"
                        {...registerReset("confirmPassword")}
                        className="w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
                      />
                    </div>
                    {resetErrors.confirmPassword && (
                      <p className="mt-2 text-xs text-red-500">{resetErrors.confirmPassword.message}</p>
                    )}
                  </div>

                  <label className="flex items-center gap-2 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      {...registerReset("remember")}
                      className="h-4 w-4 rounded border-slate-300"
                    />
                    Remember this device
                  </label>

                  <button
                    type="submit"
                    className="w-full rounded-lg bg-[#2b62e6] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1f55cc]"
                  >
                    Login
                  </button>
                </form>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

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
      <path
        d="M9.5 12.5l2 2 4-4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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

function LockIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
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
