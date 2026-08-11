"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  getVerificationBadge,
  type IdentityRole,
} from "@/lib/identity-badges";
import ReviewCard from "@/components/reviews/review-card";

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
  const [reviewPage, setReviewPage] = useState(0);
  const [reviewsList, setReviewsList] = useState<
    {
      rating: number;
      comment: string;
      reviewer: string;
      serviceTitle: string;
      serviceCategory: string;
    }[]
  >([]);

  useEffect(() => {
    if (!userProfile) return;

    const q1 = query(
      collection(db, "requests"),
      where("providerId", "==", userProfile.uid),
      where("status", "==", "completed"),
    );
    const q2 = query(
      collection(db, "requests"),
      where("buyerId", "==", userProfile.uid),
      where("status", "==", "completed"),
    );

    let active = true;

    async function loadReviews() {
      try {
        const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
        if (!active) return;

        const list: {
          rating: number;
          comment: string;
          reviewer: string;
          serviceTitle: string;
          serviceCategory: string;
        }[] = [];
        let totalRating = 0;
        let count = 0;

        snap1.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.review) {
            list.push({
              rating: data.review.rating,
              comment: data.review.comment,
              reviewer: data.buyerName || "Buyer",
              serviceTitle: data.title || "Skill Swap",
              serviceCategory: data.category || "Service",
            });
            totalRating += data.review.rating;
            count += 1;
          }
        });

        snap2.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.providerReview) {
            list.push({
              rating: data.providerReview.rating,
              comment: data.providerReview.comment,
              reviewer: data.providerName || "Provider",
              serviceTitle: data.title || "Skill Swap",
              serviceCategory: data.category || "Service",
            });
            totalRating += data.providerReview.rating;
            count += 1;
          }
        });

        setSwapsCount(count);
        setAverageRating(
          count > 0 ? Number((totalRating / count).toFixed(1)) : null,
        );
        setReviewsList(list);
      } catch (err) {
        console.error("Error loading profile reviews:", err);
      }
    }

    loadReviews();
    return () => {
      active = false;
    };
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
        <p className="text-sm text-slate-500">
          No profile data found. Please sign in.
        </p>
      </div>
    );
  }

  const displayRole = userProfile.role || propRole;
  const isNonStudentBuyer =
    displayRole === "buyer" && userProfile.accountType === "non-student";

  const name = userProfile.name || "";
  const university = userProfile.university || "";
  const degree = userProfile.degree || "";
  const yearOfStudy = userProfile.yearOfStudy || "";
  const bio =
    userProfile.providerProfile?.bio ||
    (isNonStudentBuyer
      ? "Hey there! I joined Skill Swap Hub as a buyer to discover useful services, connect with talented people, and get help when I need it."
      : displayRole === "buyer"
        ? `Hey there! I'm a student at ${university} studying ${degree}. I joined Skill Swap Hub to collaborate with other students, exchange knowledge, and learn new skills.`
        : `Hey there! I'm a ${degree} student passionate about sharing knowledge. I believe the best way to learn is to teach someone else.`);

  const badgeRole: IdentityRole =
    displayRole === "admin" ? "buyer" : displayRole;
  const verificationBadge = getVerificationBadge(
    badgeRole,
    Boolean(userProfile.verifiedStudentProvider),
    userProfile.accountType,
  );

  const academicLine = isNonStudentBuyer
    ? userProfile.email || "Buyer account"
    : [
        degree && yearOfStudy ? `${degree} (${yearOfStudy})` : degree || yearOfStudy,
        university,
      ]
        .filter(Boolean)
        .join(" - ");

  const offeredSkills = userProfile.providerProfile?.skills || [];
  const showOffered = displayRole === "provider" || displayRole === "both";

  const availabilitySlots = userProfile.providerProfile?.availability || [];
  const activeDays = new Set<string>();
  availableDays.forEach((day) => {
    if (availabilitySlots.some((slot) => slot.startsWith(day.full))) {
      activeDays.add(day.short);
    }
  });
  const previewSlots = availabilitySlots.slice(0, 3);
  const remainingSlotCount = Math.max(
    availabilitySlots.length - previewSlots.length,
    0,
  );
  const preferredSlotsLabel = availabilitySlots.length
    ? `${previewSlots.join(", ")}${remainingSlotCount > 0 ? ` +${remainingSlotCount} more` : ""}`
    : "Not added yet";
  const reviewsPerPage = reviewsList.length > 1 ? 2 : 1;
  const totalReviewPages = Math.max(
    1,
    Math.ceil(reviewsList.length / reviewsPerPage),
  );
  const visibleReviews = reviewsList.slice(
    reviewPage * reviewsPerPage,
    reviewPage * reviewsPerPage + reviewsPerPage,
  );

  useEffect(() => {
    if (reviewPage > totalReviewPages - 1) {
      setReviewPage(Math.max(0, totalReviewPages - 1));
    }
  }, [reviewPage, totalReviewPages]);

  return (
    <div className="profile-steady-cards flex flex-col gap-5 sm:gap-6">
      <section className="overflow-hidden rounded-[1.35rem] border border-slate-200/80 bg-white shadow-[0_16px_45px_rgba(15,23,42,0.04)]">
        <div className="h-2 bg-gradient-to-r from-[#2b62e6] via-[#4fd8c2] to-[#e8fbf6]" />
        <div className="grid gap-6 p-5 sm:p-6 md:p-7 lg:grid-cols-[minmax(0,1.12fr)_minmax(320px,0.88fr)] lg:items-stretch">
          <div className="flex min-w-0 flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:text-left">
            <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white bg-slate-100 shadow-[0_12px_30px_rgba(43,98,230,0.14)] sm:h-24 sm:w-24">
              {userProfile.profileImageUrl ? (
                <img
                  src={userProfile.profileImageUrl}
                  alt={name || "Profile"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center bg-gradient-to-tr from-blue-500 to-[#2b62e6] text-2xl font-bold text-white">
                  {name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <h1 className="text-2xl font-bold leading-tight text-slate-950 sm:text-[1.7rem]">
                  {name}
                </h1>
                {verificationBadge ? (
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${verificationBadge.className}`}
                  >
                    <VerifiedIcon
                      className={`h-3.5 w-3.5 ${verificationBadge.iconClassName}`}
                    />
                    {verificationBadge.label}
                  </span>
                ) : null}
              </div>

              <p className="mt-2 text-sm font-medium leading-5 text-slate-500">
                {academicLine || "Profile details not added yet"}
              </p>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm text-slate-600 sm:justify-start">
                <div className="inline-flex min-h-9 items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <StarIcon />
                  </span>
                  <span className="font-semibold text-emerald-700">
                    {averageRating !== null ? averageRating.toFixed(1) : "--"}
                  </span>
                  <span className="text-slate-500">
                    {averageRating !== null
                      ? `(${swapsCount} review${swapsCount !== 1 ? "s" : ""})`
                      : "(No reviews yet)"}
                  </span>
                </div>
                <span className="inline-flex min-h-9 items-center rounded-full border border-slate-200 bg-slate-50 px-4 font-semibold text-slate-700">
                  {swapsCount} swaps
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200/80 pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
            <div className="flex items-center gap-3 text-sm font-bold text-slate-800">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                i
              </span>
              About {name.split(" ")[0]}
            </div>
            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">
              {bio}
            </p>
          </div>
        </div>
      </section>

      <section className={`${showOffered ? "block" : "hidden"}`}>
        <div className="flex flex-col gap-4">
          {showOffered && (
            <div className="h-full rounded-[1.15rem] border border-emerald-100 bg-white p-5 shadow-[0_12px_34px_rgba(15,23,42,0.035)] sm:p-6">
              <div className="flex items-center gap-3 text-sm font-bold text-slate-800">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <CheckIcon />
                </span>
                Skills I Can Offer
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {offeredSkills.length > 0 ? (
                  offeredSkills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-bold leading-4 text-emerald-700"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-slate-400">
                    No offered skills listed yet.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-[1.15rem] border border-slate-200/80 bg-white p-5 shadow-[0_12px_34px_rgba(15,23,42,0.035)] sm:p-6">
        <div className="rounded-[1.05rem] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(248,250,252,0.92),rgba(255,255,255,1))] px-4 py-3.5 shadow-[0_8px_22px_rgba(15,23,42,0.025)] sm:px-5">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-3 text-sm font-bold text-slate-800">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-[#2b62e6]">
                  <SparkIcon />
                </span>
                Feedback you received
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {reviewsList.length} review{reviewsList.length !== 1 ? "s" : ""} available
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-400">
                {Math.min(reviewPage + 1, totalReviewPages)} / {totalReviewPages}
              </span>
              <button
                type="button"
                onClick={() => setReviewPage((current) => Math.max(0, current - 1))}
                disabled={reviewPage === 0}
                aria-label="Previous reviews"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 transition hover:border-[#2b62e6] hover:text-[#2b62e6] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeftIcon />
              </button>
              <button
                type="button"
                onClick={() =>
                  setReviewPage((current) => Math.min(totalReviewPages - 1, current + 1))
                }
                disabled={reviewPage >= totalReviewPages - 1}
                aria-label="Next reviews"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 transition hover:border-[#2b62e6] hover:text-[#2b62e6] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRightIcon />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 xl:grid-cols-2">
          {reviewsList.length > 0 ? (
            visibleReviews.map((rev, index) => (
              <ReviewCard
                key={`${rev.reviewer}-${rev.serviceTitle}-${index}`}
                reviewerName={rev.reviewer}
                rating={rev.rating}
                comment={rev.comment}
                serviceTitle={rev.serviceTitle}
                serviceCategory={rev.serviceCategory}
                contextLabel="Reviewed Service"
                directionLabel="Received"
                roleLabel="Community Review"
                tone="blue"
                compact
                tight
                className="h-full border-slate-200/70"
              />
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
              <p className="text-sm text-slate-500">
                No reviews yet. Complete your first swap to receive reviews!
              </p>
            </div>
          )}
        </div>
      </section>

      {showOffered && (
        <section className="rounded-[1.15rem] border border-slate-200/80 bg-white p-5 shadow-[0_12px_34px_rgba(15,23,42,0.035)] sm:p-6">
          <div className="flex items-center gap-3 text-sm font-bold text-slate-800">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <DotIcon />
            </span>
            Available for Swaps
          </div>
          <p className="mt-3 break-words text-sm leading-6 text-slate-500">
            Preferred slots: {preferredSlotsLabel}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {availableDays.map((day) => (
              <span
                key={day.short}
                className={`min-w-12 rounded-full px-3 py-1.5 text-center text-xs font-bold ${
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

function StarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="m12 3.8 2.5 5.08 5.6.82-4.05 3.95.96 5.58L12 16.6l-5.01 2.63.96-5.58L3.9 9.7l5.6-.82L12 3.8Z" />
    </svg>
  );
}

function VerifiedIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2.8 14.1 5l3-.5.9 2.9 2.8 1.3-1.4 2.7 1.4 2.7-2.8 1.3-.9 2.9-3-.5L12 20l-2.1-2.2-3 .5-.9-2.9-2.8-1.3 1.4-2.7-1.4-2.7L6 7.4l.9-2.9 3 .5z" />
      <path
        d="m9.6 12.1 1.6 1.6 3.4-3.5"
        fill="none"
        stroke="white"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="m12 2 1.9 5.1L19 9l-5.1 1.9L12 16l-1.9-5.1L5 9l5.1-1.9L12 2Z" />
    </svg>
  );
}

function DotIcon() {
  return (
    <span className="block h-2.5 w-2.5 rounded-full bg-current" aria-hidden="true" />
  );
}

function ChevronLeftIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
