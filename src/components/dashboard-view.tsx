"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import ProfileShell from "@/components/profile-shell";

type Role = "buyer" | "provider" | "both";

type DashboardViewProps = {
  role: Role;
};

export default function DashboardView({ role }: DashboardViewProps) {
  const { userProfile, loading } = useAuth();

  // These totals are calculated from the current user's request history.
  const [buyerActiveRequests, setBuyerActiveRequests] = useState(0);
  const [buyerCompletedRequests, setBuyerCompletedRequests] = useState(0);
  const [providerIncomingRequests, setProviderIncomingRequests] = useState(0);
  const [providerActiveJobs, setProviderActiveJobs] = useState(0);
  const [providerAvgRating, setProviderAvgRating] = useState(0.0);
  const [providerReviewCount, setProviderReviewCount] = useState(0);

  useEffect(() => {
    if (!userProfile) return;
    const uid = userProfile.uid;

    async function fetchStats() {
      try {
        // Buyer stats come from requests this user created.
        const buyerQuery = query(
          collection(db, "requests"),
          where("buyerId", "==", uid),
        );
        const buyerSnapshot = await getDocs(buyerQuery);
        let activeB = 0;
        let completedB = 0;
        buyerSnapshot.forEach((doc) => {
          const status = doc.data().status;
          if (status === "completed" && doc.data().providerReview) {
            completedB++;
          } else if (status !== "rejected") {
            activeB++;
          }
        });
        setBuyerActiveRequests(activeB);
        setBuyerCompletedRequests(completedB);

        // Provider stats come from requests assigned to this user.
        const providerQuery = query(
          collection(db, "requests"),
          where("providerId", "==", uid),
        );
        const providerSnapshot = await getDocs(providerQuery);
        let incomingP = 0;
        let activeP = 0;
        let totalStars = 0;
        let reviewsCount = 0;

        providerSnapshot.forEach((doc) => {
          const data = doc.data();
          const status = data.status;

          if (status === "pending") {
            incomingP++;
          } else if (
            status === "working" ||
            status === "revision" ||
            status === "done" ||
            status === "review_pending"
          ) {
            activeP++;
          } else if (status === "completed") {
            if (data.review && typeof data.review.rating === "number") {
              totalStars += data.review.rating;
              reviewsCount++;
            }
          }
        });

        setProviderIncomingRequests(incomingP);
        setProviderActiveJobs(activeP);
        setProviderReviewCount(reviewsCount);
        if (reviewsCount > 0) {
          setProviderAvgRating(
            parseFloat((totalStars / reviewsCount).toFixed(1)),
          );
        } else {
          setProviderAvgRating(0.0);
        }
      } catch (err) {
        console.error("Error fetching dashboard statistics:", err);
      }
    }

    fetchStats();
  }, [userProfile]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#2b62e6] border-t-transparent" />
          <p className="text-sm text-slate-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">
          Please sign in to view dashboard.
        </p>
      </div>
    );
  }

  const userRole = userProfile.role === "admin" ? role : userProfile.role || role;

  return (
    <ProfileShell role={userRole}>
      <div className="space-y-6">
        {/* Welcome banner */}
        <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-[#2f66e7]">
            Dashboard Overview
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">
            Welcome Back, {userProfile.name}!
          </h1>
          <p className="mt-2 max-w-2xl text-base text-slate-600">
            {userRole === "both"
              ? "Use both buyer and provider tools together without switching accounts."
              : userRole === "provider"
                ? "Manage your incoming requests, active swap sessions, and student feedback."
                : "Track your active swap requests, saved providers, and ratings from one place."}
          </p>

          {/* Live activity totals */}
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {userRole === "buyer" && (
              <>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm font-semibold text-slate-600">
                    Active Requests
                  </p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {buyerActiveRequests}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm font-semibold text-slate-600">
                    Swaps Completed
                  </p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {buyerCompletedRequests}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm font-semibold text-slate-600">
                    University Name
                  </p>
                  <p className="mt-2.5 text-base font-bold text-blue-700 truncate">
                    {userProfile.university || "Stanford University"}
                  </p>
                </div>
              </>
            )}

            {userRole === "provider" && (
              <>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm font-semibold text-slate-600">
                    Incoming Requests
                  </p>
                  <p className="mt-2 text-3xl font-bold text-amber-600">
                    {providerIncomingRequests}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm font-semibold text-slate-600">
                    Active Swaps
                  </p>
                  <p className="mt-2 text-3xl font-bold text-blue-700">
                    {providerActiveJobs}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm font-semibold text-slate-600">
                    Average Rating
                  </p>
                  <p className="mt-2 text-3xl font-bold text-emerald-600">
                    {providerReviewCount > 0
                      ? providerAvgRating.toFixed(1)
                      : "–"}{" "}
                    <span className="text-sm text-slate-400">
                      ({providerReviewCount} reviews)
                    </span>
                  </p>
                </div>
              </>
            )}

            {userRole === "both" && (
              <>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm font-semibold text-slate-600">
                    Service Requests
                  </p>
                  <p className="mt-2 text-3xl font-bold text-blue-700">
                    {buyerActiveRequests}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm font-semibold text-slate-600">
                    Provided Swaps
                  </p>
                  <p className="mt-2 text-3xl font-bold text-emerald-600">
                    {providerIncomingRequests + providerActiveJobs}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm font-semibold text-slate-600">
                    Rating & Reviews
                  </p>
                  <p className="mt-2 text-3xl font-bold text-amber-500">
                    {providerReviewCount > 0
                      ? providerAvgRating.toFixed(1)
                      : "–"}{" "}
                    <span className="text-sm text-slate-400">
                      ({providerReviewCount})
                    </span>
                  </p>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Dual-role activity */}
        {userRole === "both" && (
          <section className="grid gap-6 md:grid-cols-2">
            {/* Buyer activity */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:border-[#2f66e7]/40 transition-colors">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                    Buyer Details
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Your activity as a service buyer
                  </p>
                </div>
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-600">
                  Active Buyer
                </span>
              </div>
              <div className="mt-4 space-y-3.5">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-slate-500">
                    Active Service Requests
                  </span>
                  <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                    {buyerActiveRequests}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-slate-500">Swaps Completed</span>
                  <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                    {buyerCompletedRequests}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs sm:text-sm pt-2 border-t border-slate-50">
                  <span className="text-slate-600 font-medium">
                    Estimated Swaps Spent
                  </span>
                  <span className="font-bold text-[#2f66e7]">
                    {buyerCompletedRequests} Swaps
                  </span>
                </div>
              </div>
              <div className="mt-5">
                <Link
                  href="/home/buyer"
                  className="block w-full text-center rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 transition-colors"
                >
                  Go to Buyer Home 
                </Link>
              </div>
            </div>

            {/* Provider activity */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:border-[#1caa88]/40 transition-colors">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    Provider Details
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Your activity as a service provider
                  </p>
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-600">
                  Active Provider
                </span>
              </div>
              <div className="mt-4 space-y-3.5">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-slate-500">Incoming Requests</span>
                  <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                    {providerIncomingRequests}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-slate-500">Active Swaps</span>
                  <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                    {providerActiveJobs}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs sm:text-sm pt-2 border-t border-slate-50">
                  <span className="text-slate-600 font-medium">
                    Ratings & Reviews
                  </span>
                  <span className="font-bold text-[#1caa88]">
                    {providerReviewCount > 0
                      ? providerAvgRating.toFixed(1)
                      : "–"}{" "}
                    ★ ({providerReviewCount} reviews)
                  </span>
                </div>
              </div>
              <div className="mt-5">
                <Link
                  href="/incoming-requests/both"
                  className="block w-full text-center rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 transition-colors"
                >
                  Manage Incoming Requests 
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Provider upgrade callout */}
        {userRole === "buyer" && (
          <div className="overflow-hidden rounded-2xl border border-blue-100 bg-[#f8faff] p-6 shadow-sm relative">
            <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-48 h-48 bg-blue-100/30 rounded-full blur-2xl pointer-events-none" />
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-blue-700">
                  Grow as a Peer
                </div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Share your expertise and start earning!
                </h3>
                <p className="max-w-2xl text-xs text-slate-600 leading-relaxed">
                  Join our verified university provider network in Sri Lanka.
                  List services like photography, decoration, writing, design,
                  video editing, dancing, singing, or handmade crafts.
                </p>
              </div>
              <Link
                href="/become-a-seller-intro"
                className="whitespace-nowrap rounded-full bg-[#2f66e7] px-6 py-3 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-[#2552c4] hover:shadow-lg transition-all"
              >
                Become a Seller
              </Link>
            </div>
          </div>
        )}

        {/* Buyer-mode callout */}
        {userRole === "provider" && (
          <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-[#f7fdfb] p-6 shadow-sm relative">
            <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-48 h-48 bg-emerald-100/30 rounded-full blur-2xl pointer-events-none" />
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                  Learn & Swap
                </div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Looking for other student services?
                </h3>
                <p className="max-w-2xl text-xs text-slate-600 leading-relaxed">
                  Become a Buyer to purchase services from other talented peers,
                  request specialized assignment/project help, and trade skills.
                </p>
              </div>
              <Link
                href="/home/buyer"
                className="whitespace-nowrap rounded-full bg-emerald-600 px-6 py-3 text-xs font-bold text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-700 hover:shadow-lg transition-all"
              >
                Become a Buyer
              </Link>
            </div>
          </div>
        )}
      </div>
    </ProfileShell>
  );
}
