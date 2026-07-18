"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { loginAdmin } from "@/lib/auth";

export default function AdminLoginPage() {
  const router = useRouter();
  const { userProfile, loading: authLoading, refreshProfile } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && userProfile?.role === "admin") {
      router.replace("/admin");
    }
  }, [authLoading, router, userProfile]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setServerError("");
    setLoading(true);

    try {
      await loginAdmin(email.trim(), password);
      await refreshProfile();
      router.replace("/admin");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Admin login failed.";
      const lowerMessage = message.toLowerCase();

      if (lowerMessage.includes("permission-denied")) {
        setServerError(
          "Firebase connected, but Firestore blocked admin profile setup. Deploy the updated firestore.rules.",
        );
      } else if (lowerMessage.includes("operation-not-allowed")) {
        setServerError("Firebase Auth Email/Password sign-in is not enabled for this project.");
      } else if (lowerMessage.includes("network")) {
        setServerError("Could not reach Firebase. Check your internet connection and Firebase config.");
      } else if (
        lowerMessage.includes("invalid-credential") ||
        lowerMessage.includes("wrong-password") ||
        lowerMessage.includes("user-not-found")
      ) {
        setServerError("Incorrect admin email or password.");
      } else {
        setServerError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fbf9ff] px-6 py-10">
      <section className="w-full max-w-[410px] rounded-xl border border-[#dddfea] bg-white px-10 py-10 shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#2f66e7] text-white shadow-sm">
            <AdminBadgeIcon className="h-7 w-7" />
          </div>
          <h1 className="mt-5 text-[26px] font-bold leading-none text-[#242936]">Admin Panel</h1>
          <p className="mt-2 text-sm font-medium text-[#747887]">Skill Swap Hub</p>
        </div>

        {serverError ? (
          <div className="mt-7 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
            {serverError}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <label className="block">
            <span className="text-xs font-bold text-[#515563]">Admin Email</span>
            <span className="mt-2 flex h-10 items-center gap-2 rounded-md border border-[#cfd3e4] bg-[#fbfaff] px-3 focus-within:border-[#2f66e7] focus-within:ring-4 focus-within:ring-blue-100">
              <MailIcon className="h-4 w-4 text-[#626878]" />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@gmail.com"
                autoComplete="email"
                required
                className="w-full bg-transparent text-sm text-[#333846] outline-none placeholder:text-[#969baa]"
              />
            </span>
          </label>

          <label className="block">
            <span className="text-xs font-bold text-[#515563]">Password</span>
            <span className="mt-2 flex h-10 items-center gap-2 rounded-md border border-[#cfd3e4] bg-[#fbfaff] px-3 focus-within:border-[#2f66e7] focus-within:ring-4 focus-within:ring-blue-100">
              <LockIcon className="h-4 w-4 shrink-0 text-[#626878]" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="********"
                autoComplete="current-password"
                required
                className="w-full bg-transparent text-sm text-[#333846] outline-none placeholder:text-[#969baa]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="shrink-0 text-[#7c8392] transition hover:text-[#4f5665] focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOffIcon className="h-4 w-4" />
                ) : (
                  <EyeIcon className="h-4 w-4" />
                )}
              </button>
            </span>
          </label>

          <button
            type="submit"
            disabled={loading || authLoading}
            className="mt-7 flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#2f66e7] text-sm font-semibold text-white shadow-sm transition hover:bg-[#2356cb] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LoginIcon className="h-4 w-4" />
            {loading ? "Checking Admin Access..." : "Login to Admin Panel"}
          </button>
        </form>

        <div className="mt-5 flex justify-center">
          <span className="inline-flex items-center gap-2 rounded-md border border-[#e1e3ed] bg-[#f7f6ff] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.02em] text-[#697080]">
            <ShieldSmallIcon className="h-4 w-4 text-[#ef445a]" />
            Authorized admin accounts only
          </span>
        </div>
      </section>
    </main>
  );
}

function AdminBadgeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3 5 6v5.5c0 4.4 2.8 7.4 7 9.5 4.2-2.1 7-5.1 7-9.5V6z" />
      <path d="M12 12.5a2.8 2.8 0 1 0 0-5.6 2.8 2.8 0 0 0 0 5.6Z" />
      <path d="M8.2 17a4.2 4.2 0 0 1 7.6 0" />
    </svg>
  );
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="6" width="16" height="12" rx="1.5" />
      <path d="m5 7 7 5 7-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function LoginIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <path d="M10 17l5-5-5-5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 12H3" strokeLinecap="round" />
    </svg>
  );
}

function ShieldSmallIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3 6 5.5V11c0 4 2.5 6.6 6 8.5 3.5-1.9 6-4.5 6-8.5V5.5z" />
      <path d="m9.8 11.8 1.6 1.6 3-3.2" strokeLinecap="round" strokeLinejoin="round" />
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
      strokeWidth="2"
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
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}
