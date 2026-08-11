"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { scopedHref, type Role } from "@/lib/role-routes";
import { useAuth } from "@/context/AuthContext";
import { getVerificationBadge } from "@/lib/identity-badges";
import ReviewCard from "@/components/reviews/review-card";

type BuyerProfilePublicPageProps = {
  buyerId: string;
  role?: Role;
};

type BuyerActivityReview = {
  id: string;
  partnerName: string;
  partnerUniversity: string;
  skill: string;
  rating: number;
  comment: string;
  sourceRole: "provider" | "buyer";
  dateLabel: string;
};

type BuyerProfileData = {
  name: string;
  degree: string;
  university: string;
  yearOfStudy: string;
  accountType: string;
  metaLine: string;
  image: string;
  verified: boolean;
  bio: string;
  neededSkills: string[];
  completedSwaps: number;
  avgRatingReceived: string;
  reviewsReceived: BuyerActivityReview[];
  reviewsGiven: BuyerActivityReview[];
};

type FirestoreReview = {
  rating: number;
  comment: string;
};

type FirebaseRequestDoc = {
  id: string;
  title?: string;
  createdAt?: { toDate?: () => Date } | Date | string | number | null;
  providerName?: string;
  providerUniversity?: string;
  review?: FirestoreReview;
  providerReview?: FirestoreReview;
};

type FirestoreUserProfile = {
  uid?: string;
  name?: string;
  email?: string;
  accountType?: string;
  degree?: string;
  university?: string;
  yearOfStudy?: string;
  emailVerified?: boolean;
  profileImageUrl?: string;
  neededSkills?: string[];
  providerProfile?: {
    bio?: string;
    skills?: string[];
  };
  settings?: {
    profileVisibility?: boolean;
  };
  role?: string;
};

export default function BuyerProfilePublicPage({
  buyerId,
  role,
}: BuyerProfilePublicPageProps) {
  const { userProfile, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<BuyerProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPrivateProfile, setIsPrivateProfile] = useState(false);
  const [receivedPage, setReceivedPage] = useState(0);
  const [givenPage, setGivenPage] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      setLoading(true);

      try {
        const userSnap = await getDoc(doc(db, "users", buyerId));
        if (!active) return;

        if (!userSnap.exists()) {
          setProfile(null);
          setLoading(false);
          return;
        }

        const member = userSnap.data() as FirestoreUserProfile;
        const isOwnerViewing = userProfile?.uid === buyerId;
        // A private profile is still visible to its owner.
        if (member.settings?.profileVisibility === false && !isOwnerViewing) {
          setIsPrivateProfile(true);
          setProfile(null);
          setReceivedPage(0);
          setGivenPage(0);
          setLoading(false);
          return;
        }

        setIsPrivateProfile(false);
        setReceivedPage(0);
        setGivenPage(0);

        // This page is intentionally limited to buyer-only community members.
        const isProviderMember =
          member.role === "provider" ||
          member.role === "both" ||
          Boolean(member.providerProfile?.skills?.length);

        if (isProviderMember) {
          setProfile(null);
          setReceivedPage(0);
          setGivenPage(0);
          setLoading(false);
          return;
        }

        // Completed swaps provide the public ratings and activity totals.
        const requestsSnap = await getDocs(
          query(
            collection(db, "requests"),
            where("buyerId", "==", buyerId),
            where("status", "==", "completed")
          )
        );

        if (!active) return;

        const completedRequests = requestsSnap.docs.map(
          (requestDoc) => ({ id: requestDoc.id, ...requestDoc.data() }) as FirebaseRequestDoc
        );

        setProfile(buildBuyerProfile(member, completedRequests));
      } catch (error) {
        console.error("Error loading buyer public profile:", error);
        if (active) {
          setProfile(null);
          setReceivedPage(0);
          setGivenPage(0);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, [buyerId, userProfile?.uid]);

  const messageHref = role
    ? `${scopedHref("/chats", role)}?peerId=${encodeURIComponent(buyerId)}`
    : "/get-started";
  const reportHref = role
    ? `${scopedHref("/report-issue", role)}/${buyerId}`
    : "/get-started";

  const reviewsPerPage = 2;
  const totalReceivedPages = Math.max(
    1,
    Math.ceil((profile?.reviewsReceived.length || 0) / reviewsPerPage),
  );
  const totalGivenPages = Math.max(
    1,
    Math.ceil((profile?.reviewsGiven.length || 0) / reviewsPerPage),
  );

  const recentReceived = useMemo(() => {
    if (!profile) return [];
    const start = receivedPage * reviewsPerPage;
    return profile.reviewsReceived.slice(start, start + reviewsPerPage);
  }, [profile, receivedPage]);

  const recentGiven = useMemo(() => {
    if (!profile) return [];
    const start = givenPage * reviewsPerPage;
    return profile.reviewsGiven.slice(start, start + reviewsPerPage);
  }, [profile, givenPage]);

  if (loading || authLoading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#2b62e6] border-t-transparent" />
          <p className="text-sm text-slate-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (isPrivateProfile) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
        <div className="rounded-full bg-slate-100 p-5 text-slate-400">
          <LockIcon className="h-12 w-12" />
        </div>
        <h2 className="mt-6 text-2xl font-bold text-slate-800">Private Profile</h2>
        <p className="mt-2 max-w-sm text-base text-slate-500">
          This member has hidden their public profile details.
        </p>
        <Link
          href={role ? scopedHref("/find-services", role) : "/"}
          className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-[#2f66e7] px-6 text-sm font-semibold text-white transition hover:bg-[#2051ca]"
        >
          Back
        </Link>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">Buyer profile not found.</p>
      </div>
    );
  }

  const verificationBadge = getVerificationBadge("buyer", false, profile.accountType);

  return (
    <div className="flex w-full flex-col gap-4 pb-6">
      {/* Identity, study details, and contact actions */}
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-[96px_minmax(0,1fr)]">
          <MemberAvatar image={profile.image} name={profile.name} />

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="break-words text-xl font-bold leading-tight text-[#1453c4] sm:text-2xl">
                {profile.name}
              </h1>
              {verificationBadge ? (
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${verificationBadge.className}`}>
                  <VerifiedBadgeIcon className={`h-3.5 w-3.5 ${verificationBadge.iconClassName}`} />
                  {verificationBadge.label}
                </span>
              ) : null}
            </div>

            <p className="mt-1 break-words text-sm font-semibold text-slate-700 sm:text-base">
              {profile.metaLine}
            </p>
            {profile.accountType === "student" ? (
              <p className="mt-0.5 break-words text-xs font-semibold text-slate-500">
                {profile.degree}
                {profile.yearOfStudy ? ` | ${profile.yearOfStudy}` : ""}
              </p>
            ) : null}

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Link
                href={messageHref}
                className="inline-flex h-8 items-center justify-center rounded-md bg-[#1453c4] px-3 text-xs font-semibold text-white transition hover:bg-[#0f43a1]"
              >
                Message {profile.name.split(" ")[0]}
              </Link>
              <Link
                href={reportHref}
                className="inline-flex h-8 items-center justify-center rounded-md px-2 text-xs font-semibold text-red-600 transition hover:text-red-700"
              >
                Report Profile
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Buyer activity summary */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Completed Swaps" value={String(profile.completedSwaps)} sub="Buyer activity" accent />
        <MetricCard title="Avg. Rating" value={profile.avgRatingReceived} sub="Received from providers" teal />
        <MetricCard title="Reviews Received" value={String(profile.reviewsReceived.length)} sub="Provider feedback" />
        <MetricCard title="Reviews Given" value={String(profile.reviewsGiven.length)} sub="Shared by this buyer" />
      </section>

      {/* Bio and requested skills */}
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)]">
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700">About {profile.name.split(" ")[0]}</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">{profile.bio}</p>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700">Skills Looking For</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {profile.neededSkills.length > 0 ? (
              profile.neededSkills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700"
                >
                  {skill}
                </span>
              ))
            ) : (
              <p className="text-sm text-slate-400">No requested skills listed yet.</p>
            )}
          </div>
        </article>
      </section>

      {/* Reviews received and given */}
      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="rounded-[1.05rem] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(248,250,252,0.92),rgba(255,255,255,1))] px-4 py-3.5 shadow-[0_8px_22px_rgba(15,23,42,0.025)]">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-[#1453c4]">Reviews Received</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {profile.reviewsReceived.length} review
                  {profile.reviewsReceived.length !== 1 ? "s" : ""} available
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-400">
                  {Math.min(receivedPage + 1, totalReceivedPages)} / {totalReceivedPages}
                </span>
                <button
                  type="button"
                  onClick={() => setReceivedPage((current) => Math.max(0, current - 1))}
                  disabled={receivedPage === 0}
                  aria-label="Previous received reviews"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 transition hover:border-[#2b62e6] hover:text-[#2b62e6] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeftIcon />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setReceivedPage((current) => Math.min(totalReceivedPages - 1, current + 1))
                  }
                  disabled={receivedPage >= totalReceivedPages - 1}
                  aria-label="Next received reviews"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 transition hover:border-[#2b62e6] hover:text-[#2b62e6] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRightIcon />
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-3">
            {recentReceived.length > 0 ? (
              recentReceived.map((review) => (
                <BuyerReviewCard key={review.id} review={review} badgeText="Received" />
              ))
            ) : (
              <EmptyPanel message="No provider feedback received yet." compact />
            )}
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="rounded-[1.05rem] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(248,250,252,0.92),rgba(255,255,255,1))] px-4 py-3.5 shadow-[0_8px_22px_rgba(15,23,42,0.025)]">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-[#1453c4]">Reviews Given</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {profile.reviewsGiven.length} review
                  {profile.reviewsGiven.length !== 1 ? "s" : ""} available
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-400">
                  {Math.min(givenPage + 1, totalGivenPages)} / {totalGivenPages}
                </span>
                <button
                  type="button"
                  onClick={() => setGivenPage((current) => Math.max(0, current - 1))}
                  disabled={givenPage === 0}
                  aria-label="Previous given reviews"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 transition hover:border-[#2b62e6] hover:text-[#2b62e6] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeftIcon />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setGivenPage((current) => Math.min(totalGivenPages - 1, current + 1))
                  }
                  disabled={givenPage >= totalGivenPages - 1}
                  aria-label="Next given reviews"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 transition hover:border-[#2b62e6] hover:text-[#2b62e6] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRightIcon />
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-3">
            {recentGiven.length > 0 ? (
              recentGiven.map((review) => (
                <BuyerReviewCard key={review.id} review={review} badgeText="Given" />
              ))
            ) : (
              <EmptyPanel message="No public feedback shared yet." compact />
            )}
          </div>
        </article>
      </section>
    </div>
  );
}

function MemberAvatar({ image, name }: { image: string; name: string }) {
  if (image) {
    return (
      <div className="relative h-20 w-20 overflow-hidden rounded-lg sm:h-24 sm:w-24">
        <Image src={image} alt={name} fill className="object-cover" sizes="96px" priority />
      </div>
    );
  }

  return (
    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-xl font-bold text-white shadow-md sm:h-24 sm:w-24 sm:text-2xl">
      {name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)}
    </div>
  );
}

function MetricCard({
  title,
  value,
  sub,
  accent = false,
  teal = false,
}: {
  title: string;
  value: string;
  sub: string;
  accent?: boolean;
  teal?: boolean;
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-3 text-center shadow-sm">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{title}</p>
      <p className="mt-1.5 text-2xl font-bold leading-none text-slate-900 md:text-3xl">{value}</p>
      <p className={`mt-1.5 text-xs font-medium ${teal ? "text-teal-700" : "text-slate-600"}`}>{sub}</p>
      {accent ? <div className="mx-auto mt-2.5 h-1 w-full rounded-full bg-teal-700" /> : null}
    </article>
  );
}

function BuyerReviewCard({
  review,
  badgeText,
}: {
  review: BuyerActivityReview;
  badgeText: string;
}) {
  return (
    <ReviewCard
      reviewerName={review.partnerName}
      reviewerMeta={`${review.partnerUniversity || "Community Member"} | ${review.dateLabel}`}
      rating={review.rating}
      comment={review.comment}
      serviceTitle={review.skill}
      serviceCategory={review.sourceRole === "provider" ? "Provider Review" : "Buyer Review"}
      contextLabel={badgeText === "Received" ? "Reviewed Service" : "Rated Service"}
      directionLabel={badgeText}
      roleLabel={review.sourceRole === "provider" ? "Provider" : "Buyer"}
      tone={badgeText === "Received" ? "blue" : "amber"}
      compact
      tight
      className="h-full border-slate-200/70"
    />
  );
}

function ChevronLeftIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-[18px] w-[18px]">
      <path
        d="M11.75 4.5L6.25 10L11.75 15.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-[18px] w-[18px]">
      <path
        d="M8.25 4.5L13.75 10L8.25 15.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EmptyPanel({ message, compact = false }: { message: string; compact?: boolean }) {
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white text-center text-sm text-slate-500 ${
        compact ? "p-6" : "p-8"
      }`}
    >
      {message}
    </div>
  );
}

// Split review directions while calculating the buyer's public activity summary.
function buildBuyerProfile(
  member: FirestoreUserProfile,
  completedRequests: FirebaseRequestDoc[]
): BuyerProfileData {
  const isNonStudentBuyer = member.accountType === "non-student";
  const reviewsReceived: BuyerActivityReview[] = [];
  const reviewsGiven: BuyerActivityReview[] = [];

  completedRequests.forEach((request) => {
    const skill = request.title || "Skill Swap";
    const dateLabel = formatDateLabel(request.createdAt);
    const providerName = request.providerName || "Anonymous Provider";
    const providerUniversity = request.providerUniversity || "Swap Partner";

    if (request.providerReview && typeof request.providerReview.rating === "number") {
      reviewsReceived.push({
        id: `received-${request.id}`,
        partnerName: providerName,
        partnerUniversity: providerUniversity,
        skill,
        rating: request.providerReview.rating,
        comment: request.providerReview.comment || "Great learning experience.",
        sourceRole: "provider",
        dateLabel,
      });
    }

    if (request.review && typeof request.review.rating === "number") {
      reviewsGiven.push({
        id: `given-${request.id}`,
        partnerName: providerName,
        partnerUniversity: providerUniversity,
        skill,
        rating: request.review.rating,
        comment: request.review.comment || "Helpful collaboration.",
        sourceRole: "provider",
        dateLabel,
      });
    }
  });

  const avgRatingReceived =
    reviewsReceived.length > 0
      ? (
          reviewsReceived.reduce((total, review) => total + review.rating, 0) /
          reviewsReceived.length
        ).toFixed(1)
      : "New";

  return {
    name: member.name || "Anonymous Member",
    degree: isNonStudentBuyer ? "" : member.degree || "Undergraduate",
    university: isNonStudentBuyer ? "" : member.university || "Sri Lankan University",
    yearOfStudy: isNonStudentBuyer ? "" : member.yearOfStudy || "",
    accountType: member.accountType || "student",
    metaLine: isNonStudentBuyer
      ? "Non-student Buyer"
      : member.university || "Sri Lankan University",
    image: member.profileImageUrl || "",
    verified: member.emailVerified !== false,
    bio:
      member.providerProfile?.bio ||
      (isNonStudentBuyer
        ? "Non-student buyer using Skill Swap Hub to find useful services and connect with trusted members."
        : `Student at ${member.university || "a Sri Lankan university"} using Skill Swap Hub to connect with helpful peers and complete meaningful collaborations.`),
    neededSkills: member.neededSkills || [],
    completedSwaps: completedRequests.length,
    avgRatingReceived,
    reviewsReceived,
    reviewsGiven,
  };
}

function formatDateLabel(value: FirebaseRequestDoc["createdAt"]) {
  if (!value) return "Recently";

  const rawDate = value as { toDate?: () => Date } | Date | string | number;
  const date =
    typeof (rawDate as { toDate?: () => Date }).toDate === "function"
      ? (rawDate as { toDate: () => Date }).toDate()
      : new Date(rawDate as string | number | Date);

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function buildStars(value: string) {
  const rating = Math.max(0, Math.min(5, Math.round(Number(value) || 0)));
  return `${"★".repeat(rating)}${"☆".repeat(5 - rating)}`;
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 15v2m-6 4h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2Zm10-10V7a4 4 0 0 0-8 0v4h8Z"
      />
    </svg>
  );
}

function VerifiedBadgeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M12 2.8 14.1 5l3-.5.9 2.9 2.8 1.3-1.4 2.7 1.4 2.7-2.8 1.3-.9 2.9-3-.5L12 20l-2.1-2.2-3 .5-.9-2.9-2.8-1.3 1.4-2.7-1.4-2.7L6 7.4l.9-2.9 3 .5z" />
      <path d="m9.6 12.1 1.6 1.6 3.4-3.5" fill="none" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
    </svg>
  );
}
