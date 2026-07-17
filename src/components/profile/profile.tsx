"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type Role = "buyer" | "provider" | "both";

const availableDays = [
  { short: "Sun", full: "Sunday" },
  { short: "Mon", full: "Monday" },
  { short: "Tue", full: "Tuesday" },
  { short: "Wed", full: "Wednesday" },
  { short: "Thu", full: "Thursday" },
  { short: "Fri", full: "Friday" },
  { short: "Sat", full: "Saturday" },
];

export default function Profile({ role: propRole }: { role: Role }) {
  const { userProfile, loading } = useAuth();
  const [swapsCount, setSwapsCount] = useState(0);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [reviewsList, setReviewsList] = useState<{rating: number; comment: string; reviewer: string}[]>([]);

  useEffect(() => {
    if (!userProfile) return;

    // Both request directions are needed to build one complete activity summary.
    const q1 = query(
      collection(db, "requests"),
      where("providerId", "==", userProfile.uid),
      where("status", "==", "completed")
    );
    const q2 = query(
      collection(db, "requests"),
      where("buyerId", "==", userProfile.uid),
      where("status", "==", "completed")
    );

    let active = true;
    async function loadReviews() {
      try {
        const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
        if (!active) return;

        const list: {rating: number; comment: string; reviewer: string}[] = [];
        let totalRating = 0;
        let count = 0;

        snap1.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.review) {
            list.push({
              rating: data.review.rating,
              comment: data.review.comment,
              reviewer: data.buyerName || "Buyer",
            });
            totalRating += data.review.rating;
            count++;
          }
        });

        snap2.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.providerReview) {
            list.push({
              rating: data.providerReview.rating,
              comment: data.providerReview.comment,
              reviewer: data.providerName || "Provider",
            });
            totalRating += data.providerReview.rating;
            count++;
          }
        });

        setSwapsCount(count);
        setAverageRating(count > 0 ? Number((totalRating / count).toFixed(1)) : null);
        setReviewsList(list);
      } catch (err) {
        console.error("Error loading profile reviews:", err);
      }
    }

    loadReviews();
    return () => { active = false; };
  }, [userProfile]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#2b62e6] border-t-transparent" />
          <p className="text-sm text-slate-500">Loading profile details...</p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">No profile data found. Please sign in.</p>
      </div>
    );
  }

  // The route may request a view, but the saved profile is the source of truth.
  const displayRole = userProfile.role || propRole;
  const isNonStudentBuyer =
    displayRole === "buyer" && userProfile.accountType === "non-student";

  // Normalize optional profile fields before passing them into the UI.
  const name = userProfile.name || "";
  const university = userProfile.university || "";
  const degree = userProfile.degree || "";
  const yearOfStudy = userProfile.yearOfStudy || "";
  const bio = userProfile.providerProfile?.bio || (
    isNonStudentBuyer
      ? "Hey there! I joined Skill Swap Hub as a buyer to discover useful services, connect with talented people, and get help when I need it."
      : displayRole === "buyer"
        ? `Hey there! I'm a student at ${university} studying ${degree}. I joined Skill Swap Hub to collaborate with other students, exchange knowledge, and learn new skills.`
        : `Hey there! I'm a ${degree} student passionate about sharing knowledge. I believe the best way to learn is to teach someone else.`
  );
  const profileTag = userProfile.verifiedStudentProvider
    ? "Verified Student Provider"
    : isNonStudentBuyer
      ? "Non-student Buyer"
      : "Buyer";
  const identityTitle = isNonStudentBuyer ? "Email Verified Account" : "Identity Verified";
  const identityMessage = isNonStudentBuyer
    ? "This buyer account uses normal Firebase email verification for access and service requests."
    : "Student provider proof is reviewed by admin. Buyers use normal Firebase email verification.";
  const academicLine = isNonStudentBuyer
    ? userProfile.email || "Buyer account"
    : [degree && yearOfStudy ? `${degree} (${yearOfStudy})` : degree || yearOfStudy, university]
        .filter(Boolean)
        .join(" - ");

  // Provider skills come from the nested provider profile.
  const offeredSkills = userProfile.providerProfile?.skills || [];
  const neededSkills = userProfile.neededSkills || [];

  // Each role sees only the profile sections that apply to their activity.
  const showOffered = displayRole === "provider" || displayRole === "both";
  const showNeeded = displayRole === "buyer" || displayRole === "both";

  // Convert saved time values into the labels displayed on the profile.
  const availabilitySlots = userProfile.providerProfile?.availability || [];
  const activeDays = new Set<string>();
  availableDays.forEach((day) => {
    if (availabilitySlots.some((slot) => slot.startsWith(day.full))) {
      activeDays.add(day.short);
    }
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Profile Header */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            {/* Letter Avatar for Verified Student */}
            <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 shadow-inner">
              {userProfile.profileImageUrl ? (
                <img
                  src={userProfile.profileImageUrl}
                  alt={name || "Profile"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center bg-gradient-to-tr from-blue-500 to-[#2b62e6] text-xl font-bold text-white">
                  {name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-xl font-semibold text-slate-900">{name}</h1>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  {profileTag}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {academicLine || "Profile details not added yet"}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    ★
                  </span>
                  <span className="font-semibold text-emerald-700">
                    {averageRating !== null ? averageRating.toFixed(1) : "—"}
                  </span>
                  <span className="text-slate-500">
                    {averageRating !== null ? `(${swapsCount} review${swapsCount !== 1 ? "s" : ""})` : "(No reviews yet)"}
                  </span>
                </div>
                <span className="text-slate-400">|</span>
                <span className="font-semibold text-slate-700">{swapsCount} swaps</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Identity Verified Banner */}
      <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            ✓
          </span>
          <div>
            <h2 className="text-sm font-semibold text-emerald-800">{identityTitle}</h2>
            <p className="text-xs text-emerald-700">
              {identityMessage}
            </p>
          </div>
        </div>
      </section>

      {/* About + Skills */}
      <section className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-600">
              i
            </span>
            About {name.split(" ")[0]}
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600 whitespace-pre-line">
            {bio}
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {showOffered && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  ✓
                </span>
                Skills I Can Offer
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {offeredSkills.length > 0 ? (
                  offeredSkills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-slate-400">No offered skills listed yet.</p>
                )}
              </div>
            </div>
          )}

          {/* Keep the buyer "Skills I Need" card hidden for now.
          {showNeeded && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                  ✓
                </span>
                Skills I Need
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {neededSkills.length > 0 ? (
                  neededSkills.map((skill: string) => (
                    <span
                      key={skill}
                      className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-slate-400">No needed skills listed yet.</p>
                )}
              </div>
            </div>
          )}
          */}
        </div>
      </section>

      {/* Recent Reviews */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-600">
              ✦
            </span>
            Recent Reviews
          </div>
        </div>

        <div className="mt-4 grid gap-4">
          {reviewsList.length > 0 ? (
            reviewsList.map((rev, index) => (
              <div key={index} className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-700">{rev.reviewer}</span>
                  <span className="text-amber-500 text-xs font-bold">
                    {"★".repeat(rev.rating)}
                    {"☆".repeat(5 - rev.rating)}
                  </span>
                </div>
                <p className="text-xs italic text-slate-600">&ldquo;{rev.comment}&rdquo;</p>
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center py-8">
              <p className="text-sm text-slate-500">No reviews yet. Complete your first swap to receive reviews!</p>
            </div>
          )}
        </div>
      </section>

      {/* Availability */}
      {showOffered && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              ●
            </span>
            Available for Swaps
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Preferred slots: {availabilitySlots.length ? availabilitySlots.join(", ") : "Not added yet"}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {availableDays.map((day) => (
              <span
                key={day.short}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  activeDays.has(day.short)
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {day.short}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
