"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { collection, doc, getDoc, onSnapshot, query, updateDoc, where } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { scopedHref } from "@/lib/role-routes";
import type { UserProfile } from "@/lib/auth";
import { useAuth } from "@/context/AuthContext";

type GigPreviewPageProps = {
  role: "buyer" | "provider" | "both";
  backHref?: string;
  providerId?: string;
  skillIndex?: number;
};

type ReviewData = {
  name: string;
  rating: number;
  quote: string;
};

type GigPreviewData = {
  gigId: string;
  providerId: string;
  providerName: string;
  providerDegree: string;
  university: string;
  proficiency: string;
  skill: string;
  skills: string[];
  title: string;
  category: string;
  summary: string;
  availability: string;
  rating: number;
  reviews: number;
  reviewCards: ReviewData[];
  image: string;
  value: string;
  delivery: string;
  match: number;
};

const gigImages = [
  "/img/package%201.jpg",
  "/img/package%202.jpg",
  "/img/package%203.jpg",
  "/img/package%204.jpg",
  "/img/favorites/web-development.jpg",
  "/img/favorites/ui-ux-design.jpg",
  "/img/favorites/data-science.jpg",
  "/img/favorites/mathematics.jpg",
];

const fallbackGig: GigPreviewData = {
  gigId: "preview-provider-0",
  providerId: "preview-provider",
  providerName: "Amara Silva",
  providerDegree: "Creative Design Lead",
  university: "University of Moratuwa",
  proficiency: "Advanced",
  skill: "Book Cover Design",
  skills: ["Book Cover Design", "KDP Formatting", "Creative Design"],
  title: "Creative Book Cover Design - KDP & eBook",
  category: "Graphics & Design",
  summary:
    "A great book deserves a cover that grabs attention and reflects its story.",
  availability: "3-Day Delivery",
  rating: 0,
  reviews: 68,
  reviewCards: [
    {
      name: "jhonhopkins",
      rating: 0,
      quote:
        "An amazing experience working with this seller. The cover design looks modern, clean, and perfectly aligned with the concept.",
    },
    {
      name: "abigail_mend",
      rating: 0,
      quote:
        "Very high quality book cover design. The visuals immediately attract attention and match the book theme.",
    },
  ],
  image: "/img/package%201.jpg",
  value: "$20 Value",
  delivery: "3-Day Delivery",
  match: 92,
};

export default function GigPreviewPage({
  role,
  backHref,
  providerId,
  skillIndex = 0,
}: GigPreviewPageProps) {
  const { userProfile, refreshProfile } = useAuth();
  const [gig, setGig] = useState<GigPreviewData>(fallbackGig);
  const [loading, setLoading] = useState(Boolean(providerId));
  const isFavorited = Boolean(
    userProfile?.favorites?.some(
      (fav) =>
        (fav as { gigId?: string; providerId?: string }).gigId === gig.gigId ||
        ((fav as { gigId?: string; providerId?: string }).gigId
          ? false
          : (fav as { providerId?: string }).providerId === gig.providerId),
    ),
  );

  const handleToggleFavorite = async () => {
    if (!userProfile) {
      window.location.href = "/get-started";
      return;
    }

    try {
      const favorites = (userProfile.favorites || []) as Record<string, unknown>[];
      let updatedFavorites;

      if (isFavorited) {
        updatedFavorites = favorites.filter(
          (fav) =>
            (fav as { gigId?: string; providerId?: string }).gigId !== gig.gigId &&
            !(
              !(fav as { gigId?: string; providerId?: string }).gigId &&
              (fav as { providerId?: string }).providerId === gig.providerId
            ),
        );
      } else {
        const now = new Date();
        updatedFavorites = [
          ...favorites,
          {
            id: gig.gigId,
            gigId: gig.gigId,
            providerId: gig.providerId,
            title: gig.title,
            category: gig.category,
            instructor: gig.providerName,
            rating: gig.rating.toFixed(1),
            image: gig.image,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(gig.providerName)}&background=2f66e7&color=fff&size=400`,
            level: gig.proficiency,
            savedAt: `Saved ${now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`,
            description: gig.summary,
          },
        ];
      }

      await updateDoc(doc(db, "users", userProfile.uid), {
        favorites: updatedFavorites,
      });
      await refreshProfile();
    } catch (err) {
      console.error("Error toggling favorite from gig preview:", err);
    }
  };

  useEffect(() => {
    if (!providerId) return;

    const selectedProviderId = providerId;
    let active = true;
    let unsubscribeRatings: (() => void) | null = null;

    async function loadGig() {
      try {
        const providerSnap = await getDoc(doc(db, "users", selectedProviderId));
        if (!providerSnap.exists()) return;

        const user = providerSnap.data() as UserProfile;
        const profile = user.providerProfile;
        const skills = profile?.skills?.length ? profile.skills : ["Student Support"];
        const safeSkillIndex = Math.min(Math.max(skillIndex, 0), skills.length - 1);
        const skill = skills[safeSkillIndex] || skills[0];
        const storedGig = profile?.gigs?.[safeSkillIndex];

        const requestsQuery = query(
          collection(db, "requests"),
          where("providerId", "==", selectedProviderId),
          where("status", "==", "completed"),
        );

        unsubscribeRatings = onSnapshot(requestsQuery, (completedSnap) => {
          const reviewCards: ReviewData[] = [];
          let totalRating = 0;
          let reviewCount = 0;

          completedSnap.forEach((requestDoc) => {
            const request = requestDoc.data();
            const rating =
              request.review && typeof request.review.rating === "number"
                ? request.review.rating
                : undefined;
            if (!rating) return;

            totalRating += rating;
            reviewCount += 1;
            if (reviewCards.length < 2) {
              reviewCards.push({
                name: request.buyerName || "Student buyer",
                rating,
                quote:
                  request.review.comment ||
                  "Helpful, clear, and reliable support throughout the swap.",
              });
            }
          });

          const nextGig: GigPreviewData = {
          gigId: `${user.uid}-${safeSkillIndex}`,
          providerId: user.uid,
          providerName: user.name || "Anonymous Member",
          providerDegree: user.degree || "Undergraduate",
          university: user.university || "Sri Lankan University",
          proficiency: profile?.proficiency || "Skilled",
          skill,
          skills,
          title: storedGig?.title || `I will do ${skill}`,
          category: storedGig?.category || inferCategory(skill),
          summary:
            storedGig?.summary ||
            storedGig?.description ||
            normalizeSummary(profile?.bio) ||
            `Practical ${skill} support from a verified student skill swap provider.`,
          availability:
            (storedGig?.availability && storedGig.availability.join(", ")) ||
            formatAvailability(profile?.availability),
          rating: reviewCount > 0 ? Number((totalRating / reviewCount).toFixed(1)) : 0,
          reviews: reviewCount,
          reviewCards,
          image:
            storedGig?.image ||
            (profile?.gigImages && profile.gigImages[safeSkillIndex]) ||
            gigImages[safeSkillIndex % gigImages.length],
          value: `${20 + (safeSkillIndex % 3) * 5}`,
          delivery:
            storedGig?.delivery || formatAvailability(profile?.availability) || "Flexible",
          match: 95,
        };

          if (active) setGig(nextGig);
          if (active) setLoading(false);
        });
      } catch (err) {
        console.error("Error loading gig preview:", err);
        if (active) setLoading(false);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadGig();
    return () => {
      active = false;
      if (unsubscribeRatings) unsubscribeRatings();
    };
  }, [providerId, skillIndex]);

  const packageItems = useMemo(
    () => [
      `${gig.skill} guidance`,
      `${gig.proficiency} level support`,
      "Source files or notes when needed",
      "Revision support after first review",
    ],
    [gig.proficiency, gig.skill],
  );

  const isOwnGig = userProfile && userProfile.uid === gig.providerId;
  const editHref = `/edit-gig/${role}/gig-${skillIndex}`;

  const requestHref = `${scopedHref("/request-service", role)}?providerId=${encodeURIComponent(gig.providerId)}`;
  const chatHref = `${scopedHref("/chats", role)}?peerId=${encodeURIComponent(gig.providerId)}&subject=${encodeURIComponent(gig.title)}`;

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-slate-200 bg-white">
        <p className="text-sm font-semibold text-slate-500">Loading gig details...</p>
      </div>
    );
  }

  return (
    <div className="pb-10">
      <div className="mb-3">
        <Link
          href={backHref ?? `/post-gig/${role}`}
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <span aria-hidden="true">&lt;</span>
          Back
        </Link>
      </div>

      <p className="break-words text-[11px] font-semibold text-slate-500">
        {gig.category} <span className="px-1 text-slate-400">&gt;</span> {gig.skill}{" "}
        <span className="px-1 text-slate-400">&gt;</span> Student Skill Swap
      </p>

      <div className="mt-3 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <main className="min-w-0 space-y-4">
          <h1 className="break-words text-2xl font-bold leading-tight text-slate-900">{gig.title}</h1>

          <section className="overflow-hidden rounded-lg border border-slate-200 bg-[#9d6a2e] shadow-sm">
            <div className="relative h-[300px] w-full md:h-[420px]">
              <Image
                src={gig.image}
                alt={gig.title}
                fill
                priority
                className="object-contain p-5 md:p-8"
                sizes="(min-width: 1280px) 620px, 100vw"
              />
              <div className="absolute right-4 top-4 flex flex-col items-end gap-2">
                <button
                  type="button"
                  onClick={handleToggleFavorite}
                  aria-label={isFavorited ? "Remove from favorites" : "Save to favorites"}
                  className={`flex h-10 w-10 items-center justify-center rounded-full shadow-sm transition ${
                    isFavorited ? "bg-red-500 text-white" : "bg-white/95 text-slate-700 hover:bg-red-50 hover:text-red-600"
                  }`}
                >
                  <HeartIcon className="h-5 w-5" filled={isFavorited} />
                </button>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-slate-700 shadow-sm">
                  <StarIcon className="h-3.5 w-3.5 text-amber-400" />
                  {gig.rating > 0 ? gig.rating.toFixed(1) : "New"}
                </span>
              </div>
            </div>
          </section>

          <ProviderCard gig={gig} role={role} />
          <AboutCard summary={gig.summary} />

          <div className="grid gap-4 md:grid-cols-2">
            <InfoCard
              icon={<CheckCircleIcon className="h-4 w-4 text-[#1453c4]" />}
              title="What I Will Do"
              titleClass="text-[#1453c4]"
              items={[
                `Help with ${gig.skill}`,
                `Explain concepts at ${gig.proficiency.toLowerCase()} level`,
                "Review your work and suggest improvements",
                "Share useful notes, references, or files",
                "Support revisions after your first feedback",
              ]}
            />
            <InfoCard
              icon={<CheckCircleIcon className="h-4 w-4 text-teal-700" />}
              title="Why Swap With Me"
              titleClass="text-teal-700"
              items={[
                `${gig.providerDegree} background`,
                `Available: ${gig.availability}`,
                "Clear student-to-student communication",
                "Focused help based on your exact task",
              ]}
            />
          </div>

          <RequirementsCard skill={gig.skill} />
          <ReviewsSection reviews={gig.reviewCards} />
        </main>

        <aside className="min-w-0 space-y-4 lg:sticky lg:top-24">
          <PackageCard
            gig={gig}
            packageItems={packageItems}
            requestHref={requestHref}
            chatHref={chatHref}
            isOwnGig={Boolean(isOwnGig)}
            editHref={editHref}
          />
          {!isOwnGig && <SkillMatchCard match={gig.match} skill={gig.skill} />}
        </aside>
      </div>
    </div>
  );
}

function ProviderCard({ gig, role }: { gig: GigPreviewData; role: string }) {
  return (
    <Link href={`/provider-profile/${gig.providerId}?role=${role}`}>
      <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-[#1453c4]/45 hover:shadow-md cursor-pointer">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#2f66e7] text-sm font-bold text-white ring-2 ring-[#2f66e7]/20">
            {getInitials(gig.providerName)}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-bold text-[#1453c4] hover:underline">{gig.providerName}</h2>
              <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[9px] font-bold uppercase text-teal-700">
                {gig.proficiency}
              </span>
            </div>
            <p className="mt-0.5 break-words text-xs text-slate-600">
              {gig.university} - {gig.providerDegree}
            </p>
            <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-teal-700">
              <StarIcon className="h-3.5 w-3.5" />{" "}
              {gig.rating > 0 ? gig.rating.toFixed(1) : "New"} ({gig.reviews} reviews)
            </p>
          </div>
        </div>
      </article>
    </Link>
  );
}

function PackageCard({
  gig,
  packageItems,
  requestHref,
  chatHref,
  isOwnGig,
  editHref,
}: {
  gig: GigPreviewData;
  packageItems: string[];
  requestHref: string;
  chatHref: string;
  isOwnGig: boolean;
  editHref: string;
}) {
  return (
    <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="bg-[#1453c4] px-4 py-3">
        <p className="text-sm font-bold text-white">Premium Student Swap</p>
      </div>

      <div className="space-y-4 p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xl font-bold text-slate-900">{gig.value}</p>
          <p className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700">
            <ClockIcon className="h-3.5 w-3.5" /> {gig.delivery}
          </p>
        </div>

        <p className="break-words text-xs leading-5 text-slate-600">{gig.summary}</p>

        <ul className="space-y-2 border-y border-slate-200 py-3 text-xs text-slate-700">
          {packageItems.map((item) => (
            <li key={item} className="flex items-center gap-2">
              <CheckCircleIcon className="h-4 w-4 shrink-0 text-teal-700" />
              {item}
            </li>
          ))}
        </ul>

        {isOwnGig ? (
          <Link
            href={editHref}
            className="inline-flex h-10 w-full items-center justify-center rounded-md bg-[#1453c4] px-4 text-sm font-bold text-white transition hover:bg-[#0f43a1]"
          >
            Edit Gig Settings
          </Link>
        ) : (
          <>
            <Link
              href={requestHref}
              className="inline-flex h-10 w-full items-center justify-center rounded-md bg-[#1453c4] px-4 text-sm font-bold text-white transition hover:bg-[#0f43a1]"
            >
              Request Skill
            </Link>
            <Link
              href={chatHref}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <MailIcon className="h-4 w-4" />
              Message Provider
            </Link>
          </>
        )}
      </div>

      <div className="bg-[#f1f4ff] px-4 py-3 text-center text-[11px] font-semibold text-slate-500">
        SkillSwap Quality Guarantee
      </div>
    </article>
  );
}

function SkillMatchCard({ match, skill }: { match: number; skill: string }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-[#1453c4]">Skill Match</h2>
        <span className="text-sm font-bold text-teal-700">{match}%</span>
      </div>
      <div className="mt-3 h-2 rounded-full bg-slate-200">
        <div className="h-full rounded-full bg-teal-600" style={{ width: `${match}%` }} />
      </div>
      <p className="mt-3 break-words text-[11px] leading-4 text-slate-600">
        Based on this provider&apos;s listed skills and your interest in {skill}.
      </p>
    </article>
  );
}

function AboutCard({ summary }: { summary: string }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-xl font-bold text-slate-900">About this Gig</h2>
      <div className="my-3 border-t border-slate-200" />
      <p className="overflow-hidden break-words text-sm italic leading-6 text-slate-700">
        &quot;{summary}&quot;
      </p>
    </article>
  );
}

function InfoCard({
  icon,
  title,
  titleClass,
  items,
}: {
  icon: ReactNode;
  title: string;
  titleClass: string;
  items: string[];
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className={`flex items-center gap-2 text-sm font-bold ${titleClass}`}>
        {icon}
        {title}
      </h3>
      <ul className="mt-3 space-y-2 text-xs leading-5 text-slate-700">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-current" />
            <span className="min-w-0 break-words">{item}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

function RequirementsCard({ skill }: { skill: string }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-[#f0efff] p-4 shadow-sm">
      <h2 className="text-xl font-bold text-slate-900">Requirements</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Requirement title="Task Brief" detail={`What you need help with in ${skill}.`} />
        <Requirement title="Deadline & Level" detail="When you need it and your current skill level." />
        <Requirement title="Files or Links" detail="Share your draft, examples, rubric, or project files." />
      </div>
    </article>
  );
}

function Requirement({ title, detail }: { title: string; detail: string }) {
  return (
    <div>
      <h3 className="text-sm font-bold text-[#1453c4]">{title}</h3>
      <p className="mt-1 text-[11px] leading-4 text-slate-600">{detail}</p>
    </div>
  );
}

function ReviewsSection({ reviews }: { reviews: ReviewData[] }) {
  const visibleReviews = reviews.length > 0 ? reviews : fallbackGig.reviewCards;

  return (
    <section className="space-y-3">
      <h2 className="text-xl font-bold text-slate-900">What people say about this swap</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {visibleReviews.slice(0, 2).map((review, index) => (
          <ReviewCard
            key={`${review.name}-${index}`}
            review={review}
            accent={index % 2 === 0 ? "blue" : "teal"}
          />
        ))}
      </div>
    </section>
  );
}

function ReviewCard({
  review,
  accent = "blue",
}: {
  review: ReviewData;
  accent?: "blue" | "teal";
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white ${
            accent === "teal" ? "bg-teal-600" : "bg-[#2f66e7]"
          }`}
        >
          {getInitials(review.name).slice(0, 1)}
        </span>
        <div>
          <h3 className="text-sm font-bold text-slate-900">{review.name}</h3>
          <p className="text-xs font-semibold text-teal-700">
            {review.rating > 0 ? review.rating.toFixed(1) : "New"} rating
          </p>
        </div>
      </div>
      <p className="mt-3 break-words text-xs leading-5 text-slate-700">&quot;{review.quote}&quot;</p>
    </article>
  );
}

function inferCategory(skill: string) {
  const value = skill.toLowerCase();
  if (["ux", "ui", "figma", "prototype"].some((term) => value.includes(term))) return "UX Design";
  if (["graphic", "logo", "poster", "illustrator", "photoshop", "book", "cover"].some((term) => value.includes(term))) {
    return "Graphics & Design";
  }
  if (["math", "calculus", "algebra", "statistics"].some((term) => value.includes(term))) return "Mathematics";
  if (["photo", "camera", "lightroom"].some((term) => value.includes(term))) return "Photography";
  if (["video", "premiere", "film"].some((term) => value.includes(term))) return "Video Editing";
  if (["data", "sql", "excel", "analytics"].some((term) => value.includes(term))) return "Data Analysis";
  if (["web", "react", "next", "html", "css", "node"].some((term) => value.includes(term))) return "Web Development";
  if (["write", "content", "essay", "copy"].some((term) => value.includes(term))) return "Content Writing";
  if (["music", "guitar", "piano", "audio"].some((term) => value.includes(term))) return "Music";
  return "Programming";
}

function formatAvailability(availability?: string[]) {
  if (!availability || availability.length === 0) return "Flexible";
  return availability.join(", ");
}

function normalizeSummary(summary?: string) {
  const value = summary?.trim();
  if (!value) return "";

  const looksLikeUrl =
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.includes("oauth2") ||
    value.includes("accounts.google.com");

  if (looksLikeUrl) {
    return "Student partner ready to collaborate and exchange skills. Share your brief, deadline, and current progress so they can confirm the scope.";
  }

  return value;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function HeartIcon({ className, filled = false }: { className?: string; filled?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={filled ? 0 : 2} aria-hidden="true">
      <path d="M12 21s-6.4-4.1-9-8.1C1 9.8 2.4 6.2 5.8 5.6c2.1-.4 3.8.6 5 2.3.2.3.3.4.4.4s.2-.1.4-.4c1.2-1.7 2.9-2.7 5-2.3 3.4.6 4.8 4.2 2.8 7.3C18.4 16.9 12 21 12 21z" />
    </svg>
  );
}



function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5l2.5 2.5L16 9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="4" y="6" width="16" height="12" rx="2" />
      <path d="M4 8l8 5 8-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 3l2.7 5.5 6 .9-4.3 4.2 1 6-5.4-2.8-5.4 2.8 1-6-4.3-4.2 6-.9L12 3z" />
    </svg>
  );
}
