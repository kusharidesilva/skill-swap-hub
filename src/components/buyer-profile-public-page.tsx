"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { scopedHref, type Role } from "@/lib/role-routes";
import { useAuth } from "@/context/AuthContext";

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
        if (member.settings?.profileVisibility === false && !isOwnerViewing) {
          setIsPrivateProfile(true);
          setProfile(null);
          setLoading(false);
          return;
        }

        setIsPrivateProfile(false);

        const isProviderMember =
          member.role === "provider" ||
          member.role === "both" ||
          Boolean(member.providerProfile?.skills?.length);

        if (isProviderMember) {
          setProfile(null);
          setLoading(false);
          return;
        }

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

  const recentReceived = useMemo(
    () => profile?.reviewsReceived.slice(0, 6) || [],
    [profile?.reviewsReceived]
  );
  const recentGiven = useMemo(
    () => profile?.reviewsGiven.slice(0, 6) || [],
    [profile?.reviewsGiven]
  );

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

  return (
    <div className="flex w-full flex-col gap-4 pb-6">
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-[96px_minmax(0,1fr)]">
          <MemberAvatar image={profile.image} name={profile.name} />

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="break-words text-xl font-bold leading-tight text-[#1453c4] sm:text-2xl">
                {profile.name}
              </h1>
              <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-semibold text-[#1453c4]">
                {profile.verified ? "Verified Student" : "Student Member"}
              </span>
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                Buyer Profile
              </span>
            </div>

            <p className="mt-1 break-words text-sm font-semibold text-slate-700 sm:text-base">
              {profile.university}
            </p>
            <p className="mt-0.5 break-words text-xs font-semibold text-slate-500">
              {profile.degree}
              {profile.yearOfStudy ? ` | ${profile.yearOfStudy}` : ""}
            </p>

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

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Completed Swaps" value={String(profile.completedSwaps)} sub="Buyer activity" accent />
        <MetricCard title="Avg. Rating" value={profile.avgRatingReceived} sub="Received from providers" teal />
        <MetricCard title="Reviews Received" value={String(profile.reviewsReceived.length)} sub="Provider feedback" />
        <MetricCard title="Reviews Given" value={String(profile.reviewsGiven.length)} sub="Shared by this buyer" />
      </section>

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

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-[#1453c4]">Reviews Received</h2>
              <p className="mt-1 text-xs text-slate-500">
                Feedback this buyer received from providers.
              </p>
            </div>
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-[#1453c4]">
              {profile.reviewsReceived.length}
            </span>
          </div>

          <div className="mt-4 space-y-3">
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
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-[#1453c4]">Reviews Given</h2>
              <p className="mt-1 text-xs text-slate-500">
                Ratings and comments this buyer shared with others.
              </p>
            </div>
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
              {profile.reviewsGiven.length}
            </span>
          </div>

          <div className="mt-4 space-y-3">
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
  const badgeTone =
    badgeText === "Received"
      ? "bg-blue-50 text-[#1453c4]"
      : "bg-amber-50 text-amber-700";

  return (
    <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-semibold text-slate-900">{review.partnerName}</p>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${badgeTone}`}>
              {badgeText}
            </span>
            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500 ring-1 ring-slate-200">
              {review.sourceRole === "provider" ? "Provider" : "Buyer"}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {review.partnerUniversity || "Community Member"} | {review.dateLabel}
          </p>
          <p className="mt-1 text-xs font-semibold text-[#1453c4]">Service: {review.skill}</p>
        </div>
        <p className="shrink-0 text-sm font-bold text-amber-500">
          {buildStars(String(review.rating))}
        </p>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600">{review.comment}</p>
    </article>
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

function buildBuyerProfile(
  member: FirestoreUserProfile,
  completedRequests: FirebaseRequestDoc[]
): BuyerProfileData {
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
    degree: member.degree || "Undergraduate",
    university: member.university || "Sri Lankan University",
    yearOfStudy: member.yearOfStudy || "",
    image: member.profileImageUrl || "",
    verified: member.emailVerified !== false,
    bio:
      member.providerProfile?.bio ||
      `Student at ${member.university || "a Sri Lankan university"} using Skill Swap Hub to connect with helpful peers and complete meaningful collaborations.`,
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
