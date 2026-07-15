"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { checkBuyerHistory } from "@/lib/auth";
import { homeHref } from "@/lib/role-routes";

export default function BecomeSellerModal() {
  const router = useRouter();
  const { userProfile, loading } = useAuth();

  useEffect(() => {
    // Already-upgraded accounts should never see the onboarding introduction again.
    if (userProfile) {
      if (userProfile.role === "both") {
        checkBuyerHistory(userProfile.uid).then((hasHistory) => {
          if (hasHistory) {
            router.replace(homeHref("both"));
          } else {
            router.replace(homeHref("provider"));
          }
        });
      } else if (userProfile.role === "provider") {
        router.replace(homeHref("provider"));
      }
    }
  }, [userProfile, router]);

  // Keep the modal hidden while the role check redirects an existing provider.
  const isUpgraded = userProfile && (userProfile.role === "both" || userProfile.role === "provider");

  if (loading || isUpgraded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f7ff]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#2b62e6] border-t-transparent" />
          <p className="text-sm text-slate-500">
            {isUpgraded ? "Redirecting to your dashboard..." : "Loading…"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-6xl w-full max-h-[92vh] overflow-y-auto shadow-2xl relative">
        <button
          onClick={() => router.push("/home/buyer")}
          title="Close"
          className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 z-10"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <div className="grid grid-cols-1 gap-10 p-8 md:grid-cols-[1.2fr_0.8fr] md:p-12">
          {/* Provider benefits */}
          <div className="space-y-8">
            <span className="inline-flex w-fit items-center rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
              Become a Provider
            </span>

            <div>
              <h1 className="text-4xl font-semibold text-slate-900 md:text-5xl">
                Complete Your
              </h1>
              <h1 className="text-4xl font-semibold text-[#2543d7] md:text-5xl">
                Provider Profile
              </h1>
            </div>

            <div className="relative overflow-hidden rounded-3xl bg-slate-100">
              <Image
                src="/img/03.jpg"
                alt="Empower your peers"
                width={640}
                height={360}
                className="h-64 w-full object-cover md:h-72"
              />
              <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-slate-900/70 to-transparent p-4">
                <p className="text-sm text-white">
                  Empower your peers across Sri Lankan universities.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                    <ShieldIcon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Trusted Network</p>
                    <p className="text-xs text-slate-500">
                      Verified profiles from recognized Sri Lankan universities.
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-50 text-sky-700">
                    <WalletIcon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Flexible Earns</p>
                    <p className="text-xs text-slate-500">
                      Swap for skills or set your preferred rates.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Onboarding steps */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-slate-900">Setup Progress</h2>
            <div className="mt-6 space-y-6">
              <div className="flex gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#2543d7] text-white">
                  <IdCardIcon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">1. Verify Identity</p>
                  <p className="text-xs text-slate-500">
                    Upload student proof and wait for the admin review.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                  <ListIcon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">2. List Skills</p>
                  <p className="text-xs text-slate-500">
                    Define the non-technical services you can offer.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-semibold text-emerald-700">
                      Photography
                    </span>
                    <span className="rounded-full bg-sky-50 px-3 py-1 text-[10px] font-semibold text-sky-700">
                      Crafts
                    </span>
                    <span className="rounded-full border border-dashed border-slate-300 px-3 py-1 text-[10px] font-semibold text-slate-400">
                      Add Skill +
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                  <CalendarIcon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">3. Set Availability</p>
                  <p className="text-xs text-slate-500">
                    Manage the days and time slots you can accept service requests.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 border-t border-slate-200 pt-6">
              <Link
                href="/become-a-seller?upgrade=true"
                className="block w-full rounded-full bg-[#2543d7] px-5 py-3 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-[#1f3ac0]"
              >
                Let&apos;s Get Started
              </Link>
              <p className="mt-3 text-center text-xs text-slate-500">
                By proceeding, you agree to our{" "}
                <a
                  href="#"
                  className="font-semibold text-[#2543d7] hover:text-[#1f3ac0]"
                >
                  Terms of Provider Service
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
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

function WalletIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M16 12h3" strokeLinecap="round" />
    </svg>
  );
}

function IdCardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M7 9h6" strokeLinecap="round" />
      <path d="M7 13h4" strokeLinecap="round" />
      <circle cx="17" cy="12" r="2" />
    </svg>
  );
}

function ListIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M9 6h10" strokeLinecap="round" />
      <path d="M9 12h10" strokeLinecap="round" />
      <path d="M9 18h10" strokeLinecap="round" />
      <circle cx="5" cy="6" r="1" />
      <circle cx="5" cy="12" r="1" />
      <circle cx="5" cy="18" r="1" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M8 3v4" strokeLinecap="round" />
      <path d="M16 3v4" strokeLinecap="round" />
      <path d="M4 9h16" strokeLinecap="round" />
    </svg>
  );
}
