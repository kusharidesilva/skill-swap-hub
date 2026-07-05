"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { loginUser } from "@/lib/auth";
import { isUniversityEmail } from "@/lib/universities";

type Badge = {
  label: string;
  icon: "shield" | "cap";
};

const badges: Badge[] = [
  { label: "Verified student Emails", icon: "shield" },
  { label: "University Exclusive", icon: "cap" },
];

const strongPasswordHint =
  "Use your strong password with at least 6 characters.";

const loginSchema = z
  .object({
    email: z.string().email("Enter a valid university email."),
    password: z.string().min(6, "Password must be at least 6 characters."),
    remember: z.boolean().optional(),
  })
  .refine((v) => isUniversityEmail(v.email), {
    message: "Only official campus emails are allowed to sign in.",
    path: ["email"],
  });

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { remember: false },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setLoading(true);
    setServerError("");
    try {
      // The helper returns a role-aware destination after checking Firestore.
      const { user, redirectPath } = await loginUser(data.email, data.password);

      // Unverified accounts stay signed in so they can resend or recheck the email.
      if (!user.emailVerified) {
        router.push("/verify-email?from=buyer");
        return;
      }

      setLoginSuccess(true);
      setTimeout(() => {
        router.push(redirectPath);
      }, 1000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Login failed.";
      if (
        msg.includes("user-not-found") ||
        msg.includes("wrong-password") ||
        msg.includes("invalid-credential")
      ) {
        setServerError("Incorrect email or password. Please try again.");
      } else if (msg.includes("too-many-requests")) {
        setServerError(
          "Too many failed attempts. Please wait a moment and try again."
        );
      } else if (msg.includes("User profile not found")) {
        setServerError("Account setup incomplete. Please contact support.");
      } else {
        setServerError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen bg-white">
      <div className="fixed inset-0 bg-black/20" aria-hidden="true" />
      <div className="relative z-10 mx-auto flex min-h-screen items-center justify-center px-6 py-10">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl lg:grid-cols-[1.05fr_0.95fr]">
          {/* Brand message and platform benefits */}
          <section className="relative flex flex-col justify-between bg-linear-to-br from-[#2b62e6] via-[#1f5ad7] to-[#0e3a9e] px-10 py-12 text-white">
            <div className="absolute inset-0 opacity-10">
              <div className="h-full w-full bg-[linear-gradient(120deg,rgba(255,255,255,0.15)_0%,rgba(255,255,255,0.02)_50%,transparent_100%)]" />
            </div>
            <div className="relative">
              <div className="text-lg font-semibold">Skill Swap Hub</div>
              <div className="mt-10">
                <h1 className="text-3xl font-semibold sm:text-4xl">
                  Elevate your academic journey through peer-to-peer exchange.
                </h1>
                <p className="mt-4 max-w-md text-sm text-white/80">
                  Join a trusted student-only platform to share skills, request
                  support, and connect with verified university students.
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

          {/* Login form */}
          <section className="relative flex flex-col justify-center bg-white px-8 py-12 sm:px-12">
            <Link
              href="/"
              aria-label="Close"
              className="absolute right-8 top-8 inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
            >
              <CloseIcon className="h-4 w-4" />
            </Link>

            <div className="max-w-md">
              <h2 className="text-2xl font-semibold text-slate-900">
                Welcome back
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Please enter your university credentials to continue
              </p>

              {serverError && (
                <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 border border-red-200 animate-fadeIn">
                  {serverError}
                </div>
              )}

              {loginSuccess && (
                <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-left shadow-xs animate-pulse">
                  <div className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 text-xs">
                      ✓
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-emerald-800">Login Successful!</p>
                      <p className="mt-1 text-[11px] text-emerald-600">
                        Welcome back! Redirecting you to your dashboard...
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)}>
                {/* Email */}
                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    University Email
                  </label>
                  <div className="mt-2 flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2">
                    <MailIcon className="h-5 w-5 text-slate-400" />
                    <input
                      id="login-email"
                      type="email"
                      placeholder="student.name@uom.ac.lk"
                      {...register("email")}
                      className="w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-2 text-xs text-red-500">{errors.email.message}</p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-slate-700">
                      Password
                    </label>
                    <Link
                      href="/forgot-password"
                      className="text-xs font-semibold text-[#0f4cbf]"
                    >
                      Forgot Password?
                    </Link>
                  </div>
                  <div className="mt-2 flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                    <div className="flex flex-1 items-center gap-3">
                      <LockIcon className="h-5 w-5 text-slate-400" />
                      <input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        {...register("password")}
                        className="w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      {showPassword ? (
                        <EyeOffIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    {strongPasswordHint}
                  </p>
                  {errors.password && (
                    <p className="mt-2 text-xs text-red-500">{errors.password.message}</p>
                  )}
                </div>

                {/* Remember */}
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    {...register("remember")}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  Remember this device
                </label>

                {/* Submit */}
                <button
                  id="login-submit"
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-[#2b62e6] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1f55cc] disabled:opacity-60"
                >
                  {loading ? "Logging in…" : "Login"}
                </button>

                <div className="relative flex items-center justify-center text-xs text-slate-400">
                  <span className="h-px flex-1 bg-slate-200" />
                  <span className="px-3">OR</span>
                  <span className="h-px flex-1 bg-slate-200" />
                </div>

                <Link
                  href="/get-started"
                  className="flex w-full items-center justify-center rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700"
                >
                  Create New Account
                </Link>

                <p className="text-center text-sm text-slate-500">
                  Having trouble logging in?{" "}
                  <Link href="/help" className="font-semibold text-[#0f8a6b]">
                    Contact Support
                  </Link>
                </p>
              </form>
            </div>
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

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}
