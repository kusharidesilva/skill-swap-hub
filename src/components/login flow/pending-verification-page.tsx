"use client";

import Image from "next/image";
import Link from "next/link";
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

  useEffect(() => {
    if (loading || !firebaseUser || !userProfile) return;

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
        setMessage("Your proof was not approved yet. Please contact support for the next step.");
        return;
      }

      setMessage("Still pending. Please wait until the admin confirms that you are a student.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not check status.");
    } finally {
      setChecking(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f4fb]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#2b62e6] border-t-transparent" />
          <p className="text-sm text-slate-500">Loading your verification request...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f6f4fb]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(43,98,230,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(15,138,107,0.14),transparent_28%)]"
      />

      <div className="relative z-10 mx-auto flex min-h-screen items-center justify-center px-6 py-10">
        <section className="grid w-full max-w-5xl overflow-hidden rounded-[32px] bg-white shadow-[0_30px_100px_-50px_rgba(15,23,42,0.45)] lg:grid-cols-[1fr_0.88fr]">
          <div className="px-8 py-10 sm:px-12">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#eef2ff] px-3 py-1 text-xs font-semibold text-[#2b62e6]">
              <ShieldIcon className="h-4 w-4" />
              Student Verification Request Sent
            </span>

            <h1 className="mt-5 text-2xl font-semibold text-slate-900 sm:text-3xl">
              Verification Pending
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
              Your student verification request has been submitted successfully. Please wait until the admin
              reviews and approves your account. Once approved, you will be able to access the provider
              dashboard and offer your services.
            </p>

            {isRegistered ? (
              <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-left shadow-sm">
                <div className="flex gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-emerald-700">
                    <SparkleIcon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-emerald-800">Student account created successfully</p>
                    <p className="mt-1 text-xs leading-5 text-emerald-700">
                      We sent your verification request to the admin. Please wait a little until your
                      attachment is reviewed. You can check the status from here anytime.
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="mt-6 rounded-3xl border border-[#dbe7ff] bg-[#f5f8ff] p-5">
              <div className="flex items-center gap-4">
                <div className="relative flex h-16 w-16 items-center justify-center">
                  <span className="absolute inset-0 animate-ping rounded-full bg-[#cfe0ff]" />
                  <span className="absolute inset-[10px] rounded-full bg-[#dfe9ff]" />
                  <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#2b62e6] text-white shadow-lg">
                    <ClockBadgeIcon className="h-4 w-4" />
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Waiting for admin approval</p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    Until approval, provider access stays locked. After approval, you can sign in and use the
                    system as a provider.
                  </p>
                </div>
              </div>

              <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
                <Info label="Name" value={userProfile?.name || "Pending"} />
                <Info label="Email" value={firebaseUser?.email || userProfile?.email || "Pending"} />
                <Info label="University" value={userProfile?.university || "Pending"} />
                <Info label="Degree / Programme" value={userProfile?.degree || "Pending"} />
                <Info label="Year of Study" value={userProfile?.yearOfStudy || "Pending"} />
                <Info label="Uploaded Proof Type" value={userProfile?.studentProof?.fileType || "Student proof"} />
                <Info label="Current Status" value={prettyStatus(userProfile?.providerVerificationStatus)} />
              </dl>
            </div>

            {message ? (
              <p className="mt-4 rounded-lg border border-[#c8e6ec] bg-[#ecf9ff] px-4 py-3 text-xs font-semibold text-[#137c8a]">
                {message}
              </p>
            ) : null}

            <div className="mt-7 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleCheckStatus}
                disabled={checking}
                className="inline-flex h-11 items-center justify-center rounded-lg bg-[#2b62e6] px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1f55cc] disabled:opacity-60"
              >
                {checking ? "Checking..." : "Check Approval Status"}
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
              >
                Sign Out
              </button>
              <Link
                href="/help"
                className="inline-flex h-11 items-center justify-center rounded-lg px-3 text-sm font-semibold text-[#0f4cbf]"
              >
                Contact Support
              </Link>
            </div>
          </div>

          <div className="flex items-center justify-center bg-[#eef1ff] px-8 py-10">
            <div className="max-w-sm rounded-[28px] bg-[#e4e9ff] p-5 shadow-sm">
              <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
                <Image
                  src="/img/02.jpg"
                  alt="Students learning together"
                  width={520}
                  height={360}
                  className="h-auto w-full object-cover"
                />
              </div>
              <div className="mt-5 rounded-2xl bg-white/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2b62e6]">
                  What happens next
                </p>
                <ol className="mt-3 space-y-3 text-sm text-slate-700">
                  <li>1. Your student verification request is already visible in the admin panel.</li>
                  <li>2. Admin reviews the uploaded proof document and confirms your student status.</li>
                  <li>3. Once approved, you can continue as a provider in the system.</li>
                </ol>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function prettyStatus(status?: string) {
  if (!status) return "Pending";
  return status.charAt(0).toUpperCase() + status.slice(1).replaceAll("_", " ");
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{label}</dt>
      <dd className="mt-1 font-semibold text-slate-800">{value}</dd>
    </div>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M12 3l7 3v6c0 4.1-2.8 7.7-7 9-4.2-1.3-7-4.9-7-9V6l7-3z" />
      <path d="M9.5 12.5l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M12 3l1.8 4.7L18.5 9l-4.7 1.3L12 15l-1.8-4.7L5.5 9l4.7-1.3L12 3z" />
    </svg>
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
