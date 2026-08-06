"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  accountNeedsEmailVerification,
  loginUser,
  RejectedVerificationError, 
  resubmitStudentVerificationProof,
  signOut,
  SuspendedAccountError,
  type UserProfile,
} from "@/lib/auth";
import {
  isAllowedStudentProofFile,
  STUDENT_PROOF_ACCEPT,
  STUDENT_PROOF_TYPES,
  type StudentProofType,
} from "@/lib/platform";
import SelectField from "@/components/ui/select-field";
import { useAuth } from "@/context/AuthContext";

type Badge = {
  label: string;
  icon: "shield" | "cap";
};

const badges: Badge[] = [
  { label: "Verified student providers", icon: "shield" },
  { label: "Open for buyers", icon: "cap" },
];

const strongPasswordHint =
  "Use your strong password with at least 6 characters.";

const loginSchema = z
  .object({
    email: z.string().email("Enter a valid email."),
    password: z.string().min(6, "Password must be at least 6 characters."),
    remember: z.boolean().optional(),
  });

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { refreshProfile } = useAuth();
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rejectedProfile, setRejectedProfile] = useState<UserProfile | null>(null);
  const [rejectedUserId, setRejectedUserId] = useState("");
  const [proofType, setProofType] = useState<StudentProofType>(STUDENT_PROOF_TYPES[0]);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [requestMessage, setRequestMessage] = useState(
    "Please review my student proof again and approve my account if everything is correct.",
  );
  const [resubmitError, setResubmitError] = useState("");
  const [resubmitting, setResubmitting] = useState(false);
  const [suspendedProfile, setSuspendedProfile] = useState<UserProfile | null>(null);

  const hardRedirect = (href: string) => {
    if (typeof window === "undefined") return;
    window.location.replace(href);
  };

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
      const { user, profile, redirectPath } = await loginUser(data.email, data.password);

      // Non-student accounts must finish email verification before entering the app.
      if (accountNeedsEmailVerification(profile.accountType) && !user.emailVerified) {
        router.push("/verify-email?from=buyer");
        return;
      }

      setLoginSuccess(true);
      setTimeout(() => {
        router.push(redirectPath);
      }, 1000);
    } catch (err: unknown) {
      if (err instanceof RejectedVerificationError) {
        setRejectedProfile(err.profile);
        setRejectedUserId(err.user.uid);
        setProofType(err.profile.studentProof?.fileType || STUDENT_PROOF_TYPES[0]);
        setProofFile(null);
        setRequestMessage(
          err.profile.resubmissionMessage ||
            "Please review my student proof again and approve my account if everything is correct.",
        );
        setResubmitError("");
        setServerError("");
        return;
      }

      if (err instanceof SuspendedAccountError) {
        setSuspendedProfile(err.profile);
        setServerError("");
        return;
      }

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
      } else if (msg.includes("account verification was rejected")) {
        setServerError("Your account verification was rejected. Please log in again to send a new proof.");
      } else {
        setServerError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRejectedModalClose = () => {
    void signOut().finally(() => {
      setRejectedProfile(null);
      setRejectedUserId("");
      setProofFile(null);
      setResubmitError("");
      hardRedirect("/login");
    });
  };

  const handleProofChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;

    if (!file) {
      setProofFile(null);
      return;
    }

    if (!isAllowedStudentProofFile(file)) {
      setProofFile(null);
      setResubmitError("Upload a PDF, DOC, DOCX, PNG, JPG, or JPEG proof under 2 MB.");
      event.target.value = "";
      return;
    }

    setProofFile(file);
    setResubmitError("");
  };

  const handleResubmitProof = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!rejectedUserId) {
      setResubmitError("Please log in again before sending a new proof.");
      return;
    }

    if (!proofFile) {
      setResubmitError("Please upload your corrected student proof.");
      return;
    }

    setResubmitting(true);
    setResubmitError("");

    try {
      await resubmitStudentVerificationProof({
        userId: rejectedUserId,
        proofType,
        proofFile,
        requestMessage,
      });
      await refreshProfile();
      router.replace("/pending-verification?registered=true");
    } catch (err: unknown) {
      setResubmitError(
        err instanceof Error ? err.message : "Could not send your new proof. Please try again.",
      );
    } finally {
      setResubmitting(false);
    }
  };

  return (
    <main className="auth-gradient-animate relative min-h-screen bg-[linear-gradient(140deg,#f0fdfa_0%,#e0f2fe_44%,#f8fbff_100%)]">
      <div className="auth-gradient-animate fixed inset-0 bg-[linear-gradient(120deg,rgba(15,118,110,0.16),rgba(37,99,235,0.12),rgba(255,255,255,0.22))]" aria-hidden="true" />
      <div
        className={`relative z-10 mx-auto flex min-h-screen items-center justify-center px-4 py-6 transition duration-300 sm:px-6 lg:py-10 ${
          rejectedProfile ? "pointer-events-none select-none blur-sm" : ""
        }`}
        aria-hidden={Boolean(rejectedProfile)}
      >
        <div className="grid w-full max-h-[90vh] max-w-xl overflow-y-auto rounded-3xl bg-white shadow-2xl lg:max-h-none lg:max-w-5xl lg:overflow-hidden lg:grid-cols-[1.05fr_0.95fr]">
          {/* Brand message and platform benefits */}
          <section className="auth-gradient-animate relative hidden flex-col justify-between bg-linear-to-br from-[#2f66e7] via-[#1d7fe7] to-[#173b8f] px-10 py-12 text-white lg:flex">
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
                  Join a trusted service platform where verified student providers
                  offer creative, non-technical services to buyers.
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
          <section className="relative flex flex-col items-center justify-center bg-white px-5 py-8 sm:px-7 md:px-8 lg:items-stretch lg:px-12 lg:py-12">
            <Link
              href="/"
              aria-label="Close"
              className="absolute right-8 top-8 inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
            >
              <CloseIcon className="h-4 w-4" />
            </Link>

            <div className="w-full max-w-md">
              <p className="mb-2 text-sm font-bold uppercase tracking-wide text-[#2b62e6] lg:hidden">
                Login to your account
              </p>
              <h2 className="text-2xl font-semibold text-slate-900">
                Welcome back
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Please enter your account credentials to continue
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
                    Email
                  </label>
                  <div className="mt-2 flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2">
                    <MailIcon className="h-5 w-5 text-slate-400" />
                    <input
                      id="login-email"
                      type="email"
                      placeholder="name@example.com"
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
                      className="cursor-pointer text-slate-400 hover:text-slate-600 focus:outline-none"
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
                  className="w-full cursor-pointer rounded-lg bg-[#2b62e6] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1f55cc] disabled:cursor-not-allowed disabled:opacity-60"
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
      {rejectedProfile ? (
        <RejectedVerificationModal
          profile={rejectedProfile}
          proofType={proofType}
          proofFile={proofFile}
          requestMessage={requestMessage}
          resubmitError={resubmitError}
          resubmitting={resubmitting}
          onClose={handleRejectedModalClose}
          onProofTypeChange={setProofType}
          onProofChange={handleProofChange}
          onRequestMessageChange={setRequestMessage}
          onSubmit={handleResubmitProof}
        />
      ) : null}
      {suspendedProfile ? (
        <SuspendedAccountModal
          profile={suspendedProfile}
          onClose={() => setSuspendedProfile(null)}
        />
      ) : null}
    </main>
  );
}

function SuspendedAccountModal({
  profile,
  onClose,
}: {
  profile: UserProfile;
  onClose: () => void;
}) {
  const title =
    profile.suspensionTitle?.trim() || "This account has been suspended";
  const reason =
    profile.suspensionReason?.trim() ||
    profile.adminSuspensionReason?.trim() ||
    "An admin suspended this account. Please contact support for more information.";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/35 px-4 py-8 backdrop-blur-md">
      <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-white/70 bg-white/95 p-6 text-slate-900 shadow-[0_24px_80px_rgba(15,23,42,0.24)]">
        <div className="absolute -right-16 -top-20 h-44 w-44 rounded-full bg-red-100/80 blur-2xl" aria-hidden="true" />
        <div className="absolute -bottom-20 -left-16 h-44 w-44 rounded-full bg-amber-100/80 blur-2xl" aria-hidden="true" />
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 z-10 inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
          aria-label="Close suspended account popup"
        >
          <CloseIcon className="h-4 w-4" />
        </button>

        <div className="relative">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 ring-8 ring-red-50/60">
            <WarningIcon className="h-6 w-6" />
          </span>
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.28em] text-red-600">
            Account suspended
          </p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            {title}
          </h3>
          <p className="mt-3 text-sm leading-6 text-slate-600">{reason}</p>

          {profile.suspensionReportId || profile.suspensionRequestId ? (
            <div className="mt-5 rounded-2xl border border-red-100 bg-red-50/80 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-600">
                Reference
              </p>
              <p className="mt-2 text-sm leading-6 text-red-900">
                {profile.suspensionReportId
                  ? `Report ID: ${profile.suspensionReportId}`
                  : `Request ID: ${profile.suspensionRequestId}`}
              </p>
            </div>
          ) : null}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a
              href="mailto:admin@skillswaphub.lk"
              className="inline-flex h-12 flex-1 items-center justify-center rounded-xl bg-[#2b62e6] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1f55cc]"
            >
              Contact Admin
            </a>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-12 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RejectedVerificationModal({
  profile,
  proofType,
  proofFile,
  requestMessage,
  resubmitError,
  resubmitting,
  onClose,
  onProofTypeChange,
  onProofChange,
  onRequestMessageChange,
  onSubmit,
}: {
  profile: UserProfile;
  proofType: StudentProofType;
  proofFile: File | null;
  requestMessage: string;
  resubmitError: string;
  resubmitting: boolean;
  onClose: () => void;
  onProofTypeChange: (value: StudentProofType) => void;
  onProofChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onRequestMessageChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const adminNote = profile.adminNote?.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/35 px-4 py-8 backdrop-blur-md">
      <form
        onSubmit={onSubmit}
        className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-white/70 bg-white/90 p-6 text-slate-900 shadow-[0_24px_80px_rgba(15,23,42,0.24)]"
      >
        <div className="absolute -right-16 -top-20 h-44 w-44 rounded-full bg-red-100/80 blur-2xl" aria-hidden="true" />
        <div className="absolute -bottom-20 -left-16 h-44 w-44 rounded-full bg-sky-100/80 blur-2xl" aria-hidden="true" />
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 z-10 inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
          aria-label="Close rejected verification popup"
        >
          <CloseIcon className="h-4 w-4" />
        </button>

        <div className="relative">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 ring-8 ring-red-50/60">
            <WarningIcon className="h-6 w-6" />
          </span>
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.28em] text-red-600">
            Verification rejected
          </p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            Send a new proof for review
          </h3>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Your account cannot be used until the admin reviews your student proof again.
            Upload a corrected proof and send a short request to reopen the approval.
          </p>

          <div className="mt-5 rounded-2xl border border-red-100 bg-red-50/80 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-600">
              Admin note
            </p>
            <p className="mt-2 text-sm leading-6 text-red-900">
              {adminNote ||
                "No admin note was added. Please upload a clear student ID or university confirmation letter and ask the admin to review again."}
            </p>
          </div>

          {profile.studentProof?.fileName ? (
            <p className="mt-3 text-xs text-slate-500">
              Last uploaded proof: <span className="font-semibold text-slate-700">{profile.studentProof.fileName}</span>
            </p>
          ) : null}

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <SelectField
              label="Proof Type"
              value={proofType}
              onChange={(value) => onProofTypeChange(value as StudentProofType)}
              options={[...STUDENT_PROOF_TYPES]}
              title="Select corrected proof type"
              className="h-12 rounded-xl text-sm"
            />
            <div>
              <label className="text-sm font-semibold text-slate-700">
                Corrected Proof
              </label>
              <label className="mt-2 flex h-12 cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-600 transition hover:border-[#2b62e6]">
                <span className="min-w-0 truncate">
                  {proofFile?.name || "Upload proof"}
                </span>
                <span className="shrink-0 font-semibold text-[#1454cc]">Choose</span>
                <input
                  type="file"
                  accept={STUDENT_PROOF_ACCEPT}
                  onChange={onProofChange}
                  className="sr-only"
                />
              </label>
            </div>
          </div>

          <label className="mt-4 block text-sm font-semibold text-slate-700">
            Message to admin
            <textarea
              value={requestMessage}
              onChange={(event) => onRequestMessageChange(event.target.value)}
              className="mt-2 min-h-24 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-normal text-slate-700 outline-none transition focus:border-[#2b62e6] focus:ring-2 focus:ring-blue-100"
              placeholder="Please check my proof again and approve my account if everything is correct."
            />
          </label>

          {resubmitError ? (
            <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {resubmitError}
            </p>
          ) : null}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              disabled={resubmitting}
              className="inline-flex h-12 flex-1 cursor-pointer items-center justify-center rounded-xl bg-[#2b62e6] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1f55cc] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {resubmitting ? "Sending request..." : "Send Request Again"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-12 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Close
            </button>
          </div>
        </div>
      </form>
    </div>
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

function WarningIcon({ className }: { className?: string }) {
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
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
      <path d="M10.3 4.3 2.8 17.2A2 2 0 0 0 4.5 20h15a2 2 0 0 0 1.7-2.8L13.7 4.3a2 2 0 0 0-3.4 0Z" />
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
