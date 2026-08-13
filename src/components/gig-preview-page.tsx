"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type MouseEvent, type ReactNode } from "react";
import { addDoc, collection, doc, getDoc, onSnapshot, query, serverTimestamp, setDoc, updateDoc, where } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { buildGigRatingSummary, requestMatchesGig } from "@/lib/gig-ratings";
import { ensureGigTitlePrefix } from "@/lib/gig-titles";
import { formatRatingLabel } from "@/lib/ratings";
import { scopedHref, resolveRole, type Role, type SiteRole } from "@/lib/role-routes";
import type { UserProfile } from "@/lib/auth";
import { useAuth } from "@/context/AuthContext";
import { createNotification } from "@/lib/notifications";
import { inferServiceCategory } from "@/lib/platform";
import { getGigCoverForCategory } from "@/lib/gig-covers";
import ReviewFeedbackCard from "@/components/reviews/review-card";

type GigPreviewPageProps = {
  role: SiteRole;
  backHref?: string;
  gigId?: string;
  providerId?: string;
  skillIndex?: number;
  embedded?: boolean;
  onGuestAction?: () => void;
};

type ReviewData = {
  name: string;
  meta?: string;
  rating: number;
  quote: string;
  serviceTitle?: string;
  serviceCategory?: string;
};

type GigPreviewData = {
  gigId: string;
  providerId: string;
  providerName: string;
  providerDegree: string;
  providerRole?: Role;
  university: string;
  proficiency: string;
  skill: string;
  skills: string[];
  title: string;
  category: string;
  summary: string;
  price: number | string;
  availability: string;
  rating: number;
  reviews: number;
  reviewCards: ReviewData[];
  image: string;
  value: string;
  delivery: string;
  match: number;
};

const fallbackGig: GigPreviewData = {
  gigId: "preview-provider-0",
  providerId: "preview-provider",
  providerName: "Amara Silva",
  providerDegree: "Creative Design Lead",
  university: "University of Moratuwa",
  proficiency: "Advanced",
  skill: "Book Cover Design",
  skills: ["Book Cover Design", "KDP Formatting", "Creative Design"],
  title: ensureGigTitlePrefix("Creative Book Cover Design - KDP & eBook"),
  category: "Graphic Design",
  summary:
    "A great book deserves a cover that grabs attention and reflects its story.",
  price: 5000,
  availability: "3-Day Delivery",
  rating: 0,
    reviews: 0,
    reviewCards: [],
  image: "/img/gig-graphic.png",
  value: "LKR 5,000",
  delivery: "3-Day Delivery",
  match: 92,
};

export default function GigPreviewPage({
  role,
  backHref,
  gigId,
  providerId,
  skillIndex = 0,
  embedded = false,
  onGuestAction,
}: GigPreviewPageProps) {
  const router = useRouter();
  const { userProfile, refreshProfile } = useAuth();
  const [gig, setGig] = useState<GigPreviewData>(fallbackGig);
  const [loading, setLoading] = useState(Boolean(providerId));
  const [requesting, setRequesting] = useState(false);
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
      onGuestAction?.();
      if (!onGuestAction) {
        router.push("/get-started");
      }
      return;
    }

    try {
      // The stable gig key prevents duplicate saves for the same card.
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
            rating: formatRatingLabel(gig.rating),
            image: gig.image,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(gig.providerName)}&background=2f66e7&color=fff&size=400`,
            savedAt: `Saved ${now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`,
            description: gig.summary,
            university: gig.university,
            price: gig.price,
            availability: gig.availability,
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
    if (!providerId && !gigId) return;

    let active = true;
    let unsubscribeRatings: (() => void) | null = null;

    async function loadGig() {
      try {
        if (role === "guest") {
          if (!gigId) {
            if (active) setLoading(false);
            return;
          }

          const publicGigSnap = await getDoc(doc(db, "gigs", gigId));
          if (!publicGigSnap.exists()) {
            if (active) setLoading(false);
            return;
          }

          const publicGig = publicGigSnap.data() as {
            gigId?: string;
            providerId?: string;
            providerName?: string;
            degreeName?: string;
            university?: string;
            yearOfStudy?: string;
            category?: string;
            title?: string;
            summary?: string;
            description?: string;
            price?: number | string;
            availability?: string[];
            sampleWorkUrl?: string;
            image?: string;
            delivery?: string;
          };

          const publicGigDetails: GigPreviewData = {
            gigId: publicGig.gigId || gigId,
            providerId: publicGig.providerId || providerId || "guest-provider",
            providerName: publicGig.providerName || "Campus Student",
            providerDegree: publicGig.degreeName || publicGig.yearOfStudy || "Verified Student",
            providerRole: "provider",
            university: publicGig.university || "Sri Lankan University",
            proficiency: "Skilled",
            skill: publicGig.title || publicGig.category || "Student Support",
            skills: [publicGig.title || publicGig.category || "Student Support"],
            title: ensureGigTitlePrefix(publicGig.title || "Student Skill Gig"),
            category: publicGig.category || "Service",
            summary:
              publicGig.summary ||
              publicGig.description ||
              "Practical support from a verified student service provider.",
            price: publicGig.price || "",
            availability: formatAvailability(publicGig.availability),
            rating: 0,
            reviews: 0,
            reviewCards: [],
            image:
              publicGig.sampleWorkUrl ||
              publicGig.image ||
              getGigCoverForCategory(publicGig.category, publicGig.title, Math.max(skillIndex, 0)),
            value: "20",
            delivery: publicGig.delivery || "Flexible",
            match: 95,
          };

          if (active) {
            setGig(publicGigDetails);
            setLoading(false);
          }
          return;
        }

        if (!providerId) {
          if (active) setLoading(false);
          return;
        }

        const selectedProviderId = providerId;
        // Load provider details first, then subscribe to completed swap reviews.
        const providerSnap = await getDoc(doc(db, "users", selectedProviderId));
        if (!providerSnap.exists()) return;

        const user = providerSnap.data() as UserProfile;
        const profile = user.providerProfile;
        const skills = profile?.skills?.length ? profile.skills : ["Student Support"];
        const profileGigs = profile?.gigs || [];
        const matchedGigIndex = gigId
          ? profileGigs.findIndex((item) => item.id === gigId)
          : -1;
        const resolvedSkillIndex =
          matchedGigIndex >= 0
            ? matchedGigIndex
            : Math.min(Math.max(skillIndex, 0), Math.max(skills.length - 1, 0));
        const safeSkillIndex = resolvedSkillIndex;
        const skill = skills[safeSkillIndex] || profileGigs[safeSkillIndex]?.title || skills[0];
        const storedGig = profileGigs[safeSkillIndex];
        const normalizedGigSnap = gigId ? await getDoc(doc(db, "gigs", gigId)) : null;
        const normalizedGig = normalizedGigSnap?.exists() ? normalizedGigSnap.data() : null;

        const requestsQuery = query(
          collection(db, "requests"),
          where("providerId", "==", selectedProviderId),
          where("status", "==", "completed"),
        );

        unsubscribeRatings = onSnapshot(requestsQuery, (completedSnap) => {
          const reviewCards: ReviewData[] = [];
          const gigMatchTarget = {
            id: gigId || storedGig?.id || `${user.uid}-${safeSkillIndex}`,
            gigId: gigId || storedGig?.id,
            title: ensureGigTitlePrefix(String(normalizedGig?.title || storedGig?.title || skill)),
            category: String(normalizedGig?.category || storedGig?.category || inferCategory(skill)),
          };
          const matchedRequests = completedSnap.docs
            .map((requestDoc) => requestDoc.data())
            .filter((request) => requestMatchesGig(gigMatchTarget, request));
          const ratingSummary = buildGigRatingSummary(gigMatchTarget, matchedRequests);

          matchedRequests.forEach((request) => {
            const rating =
              request.review && typeof request.review.rating === "number"
                ? request.review.rating
                : undefined;
            if (!rating) return;

            if (reviewCards.length < 2) {
              reviewCards.push({
                name: request.buyerName || "Student buyer",
                meta: formatReviewDateLabel(request.createdAt),
                rating,
                quote:
                  request.review.comment ||
                  "Helpful, clear, and reliable support throughout the swap.",
                serviceTitle: gigMatchTarget.title,
                serviceCategory: gigMatchTarget.category,
              });
            }
          });

          const nextGig: GigPreviewData = {
          gigId: gigId || storedGig?.id || `${user.uid}-${safeSkillIndex}`,
          providerId: user.uid,
          providerName: user.name || "Anonymous Member",
          providerDegree: user.degree || "Undergraduate",
          providerRole: resolveRole(user.role, "provider"),
          university: user.university || "Sri Lankan University",
          proficiency: profile?.proficiency || "Skilled",
          skill,
          skills,
          title: ensureGigTitlePrefix(String(normalizedGig?.title || storedGig?.title || skill)),
          category: String(normalizedGig?.category || storedGig?.category || inferCategory(skill)),
          summary:
            String(
              normalizedGig?.summary ||
              normalizedGig?.description ||
              storedGig?.summary ||
            storedGig?.description ||
            normalizeSummary(profile?.bio) ||
              `Practical ${skill} support from a verified student service provider.`,
            ),
          price: (normalizedGig?.price as number | string | undefined) || storedGig?.price || "",
          availability:
            (Array.isArray(normalizedGig?.availability) && normalizedGig.availability.join(", ")) ||
            (storedGig?.availability && storedGig.availability.join(", ")) ||
            formatAvailability(profile?.availability),
          rating: ratingSummary.rating,
          reviews: ratingSummary.count,
          reviewCards,
          image:
            String(
              normalizedGig?.sampleWorkUrl ||
              normalizedGig?.image ||
              storedGig?.image ||
              (profile?.gigImages && profile.gigImages[safeSkillIndex]) ||
              getGigCoverForCategory(
                String(normalizedGig?.category || storedGig?.category || inferCategory(skill)),
                String(normalizedGig?.title || storedGig?.title || skill),
                safeSkillIndex,
              ),
            ),
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
  }, [gigId, providerId, role, skillIndex]);

  // Package details are derived from the current gig rather than stored separately.
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
  const isGuestView = role === "guest";
  const activeRole = isGuestView ? "buyer" : role;
  const editHref = !isGuestView ? `/edit-gig/${role}/gig-${skillIndex}` : "/get-started";
  const chatHref = !isGuestView
    ? `${scopedHref("/chats", role)}?peerId=${encodeURIComponent(gig.providerId)}&subject=${encodeURIComponent(gig.title)}&gigId=${encodeURIComponent(gig.gigId)}&category=${encodeURIComponent(gig.category)}&price=${encodeURIComponent(String(gig.price || ""))}&providerName=${encodeURIComponent(gig.providerName)}`
    : "/get-started";

  const handleRequestNow = async () => {
    if (!userProfile) {
      onGuestAction?.();
      if (!onGuestAction) {
        router.push("/get-started");
      }
      return;
    }

    if (isOwnGig || requesting) return;

    setRequesting(true);

    try {
      const buyerId = userProfile.uid;
      const providerIdValue = gig.providerId;
      const serviceContext = {
        gigId: gig.gigId,
        title: gig.title,
        category: gig.category,
        price: gig.price || "",
        providerName: gig.providerName,
      };
      const directRequestRef = doc(collection(db, "directServiceRequests"));
      const orderRef = doc(collection(db, "serviceOrders"));
      const chatId = `${buyerId}_${providerIdValue}_${slugSegment(gig.gigId)}`;

      await setDoc(directRequestRef, {
        directRequestId: directRequestRef.id,
        buyerUserId: buyerId,
        buyerName: userProfile.name || "Buyer",
        providerId: providerIdValue,
        providerName: gig.providerName,
        gigId: gig.gigId,
        requestStatus: "active",
        serviceTitle: gig.title,
        serviceCategory: gig.category,
        price: gig.price || "",
        createdAt: serverTimestamp(),
      });

      await setDoc(orderRef, {
        orderId: orderRef.id,
        buyerUserId: buyerId,
        buyerName: userProfile.name || "Buyer",
        providerId: providerIdValue,
        providerName: gig.providerName,
        gigId: gig.gigId,
        directRequestId: directRequestRef.id,
        agreedPrice: gig.price || "",
        orderStatus: "active",
        serviceTitle: gig.title,
        serviceCategory: gig.category,
        startedAt: serverTimestamp(),
      });

      await setDoc(
        doc(db, "chats", chatId),
        {
          participants: [buyerId, providerIdValue],
          participantNames: {
            [buyerId]: userProfile.name || "Buyer",
            [providerIdValue]: gig.providerName,
          },
          participantUniversities: {
            [buyerId]: userProfile.university || "",
            [providerIdValue]: gig.university || "",
          },
          participantRoles: {
            [buyerId]: "buyer",
            [providerIdValue]: "provider",
          },
          participantSkills: {
            [buyerId]: gig.title,
            [providerIdValue]: gig.title,
          },
          orderId: orderRef.id,
          directRequestId: directRequestRef.id,
          gigId: gig.gigId,
          serviceContext,
          lastMessage: `Gig: ${gig.title}`,
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
        },
        { merge: true },
      );

      await addDoc(collection(db, `chats/${chatId}/messages`), {
        senderId: buyerId,
        senderName: userProfile.name || "Buyer",
        senderRole: "buyer",
        text: `Hi ${gig.providerName}, I'm interested in your "${gig.title}" gig. Could you share more details about this.`,
        serviceContext,
        attachments: [],
        createdAt: serverTimestamp(),
      });

      await createNotification({
        userId: providerIdValue,
        title: "New Direct Service Request",
        description: `${userProfile.name || "Buyer"} requested "${gig.title}".`,
        type: "request",
        icon: "request",
        tone: "blue",
        href: `${scopedHref("/chats", gig.providerRole || "provider")}?chatId=${chatId}`,
      });

      const nextRequestRole = userProfile.role === "provider" ? "both" : activeRole;

      if (userProfile.role === "provider") {
        await updateDoc(doc(db, "users", buyerId), {
          role: "both",
        });
        await refreshProfile();
      }

      router.push(`${scopedHref("/chats", nextRequestRole)}?chatId=${encodeURIComponent(chatId)}`);
    } catch (error) {
      console.error("Error creating direct request:", error);
    } finally {
      setRequesting(false);
    }
  };

  const handleMessageProvider = (event: MouseEvent<HTMLAnchorElement>) => {
    if (userProfile) return;

    event.preventDefault();
    onGuestAction?.();
    if (!onGuestAction) {
      router.push("/get-started");
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-slate-200 bg-white">
        <p className="text-sm font-semibold text-slate-500">Loading gig details...</p>
      </div>
    );
  }

  return (
    <div className="pb-10">
      {/* Back navigation and gig breadcrumb */}
      {!embedded ? (
        <div className="mb-3">
          <Link
            href={backHref ?? (isGuestView ? "/" : `/post-gig/${role}`)}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <span aria-hidden="true">&lt;</span>
            Back
          </Link>
        </div>
      ) : null}

      <div className="rounded-[30px] border border-white/75 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(241,246,255,0.94))] p-5 shadow-[0_20px_64px_rgba(15,23,42,0.08)] backdrop-blur-sm lg:p-6">
        <p className="break-words text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
          {gig.category} <span className="px-1 text-slate-300">&gt;</span> {gig.skill}{" "}
          <span className="px-1 text-slate-300">&gt;</span> Student Skill Swap
        </p>

        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <h1 className="break-words text-[1.85rem] font-black leading-[1.06] tracking-tight text-slate-950 lg:text-[2.35rem]">
              {gig.title}
            </h1>
            <p className="mt-3 max-w-2xl text-[15px] leading-7 text-slate-600 lg:text-[15.5px]">
              {gig.summary}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2.5 text-xs font-bold text-[#1453c4] shadow-sm">
              <StarIcon className="h-3.5 w-3.5 text-amber-400" />
              {gig.reviews > 0 ? `${formatRatingLabel(gig.rating)} from ${gig.reviews} reviews` : "New listing"}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-700 shadow-sm">
              <ClockIcon className="h-3.5 w-3.5" />
              {gig.delivery}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-5 grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_292px] 2xl:grid-cols-[minmax(0,1fr)_304px]">
        <main className="min-w-0 space-y-3">
          <section className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_18px_48px_rgba(15,23,42,0.06)]">
            <div className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(63,94,251,0.18),transparent_38%),linear-gradient(135deg,#eef4ff_0%,#f8fbff_40%,#edf8f6_100%)] px-5 py-5 md:px-7 md:py-7">
              <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] [background-size:22px_22px]" />
              <div className="relative h-[300px] w-full overflow-hidden rounded-[26px] border border-white/80 bg-white shadow-[0_24px_42px_rgba(15,23,42,0.08)] md:h-[390px]">
                <Image
                  src={gig.image}
                  alt={gig.title}
                  fill
                  priority
                  className="object-contain p-6 md:p-8"
                  sizes="(min-width: 1280px) 620px, 100vw"
                />
              </div>
              <div className="absolute right-6 top-6 flex flex-col items-end gap-2">
                <button
                  type="button"
                  onClick={handleToggleFavorite}
                  aria-label={isFavorited ? "Remove from favorites" : "Save to favorites"}
                  className={`flex h-11 w-11 items-center justify-center rounded-full shadow-[0_12px_24px_rgba(15,23,42,0.12)] transition ${
                    isFavorited ? "bg-red-500 text-white" : "bg-white/95 text-slate-700 hover:bg-red-50 hover:text-red-600"
                  }`}
                >
                  <HeartIcon className="h-5 w-5" filled={isFavorited} />
                </button>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3.5 py-1.5 text-xs font-bold text-slate-700 shadow-[0_10px_24px_rgba(15,23,42,0.08)]">
                  <StarIcon className="h-3.5 w-3.5 text-amber-400" />
                  {formatRatingLabel(gig.rating)}
                </span>
              </div>
            </div>
          </section>

          <ProviderCard gig={gig} role={role} summary={gig.summary} />

          <div className="pt-2">
            <QuickFactsCard gig={gig} />
          </div>

          <div className="space-y-3">

            <div className="grid gap-3 md:grid-cols-2">
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

            <ReviewsSection reviews={gig.reviewCards} />
          </div>
        </main>

        <aside className="min-w-0 self-start space-y-3 xl:sticky xl:top-3">
          <PackageCard
            gig={gig}
            packageItems={packageItems}
            chatHref={chatHref}
            isOwnGig={Boolean(isOwnGig)}
            editHref={editHref}
            requesting={requesting}
            onRequestNow={handleRequestNow}
            onMessageProvider={handleMessageProvider}
          />
        </aside>
      </div>
    </div>
  );
}

function ProviderCard({
  gig,
  role,
  summary,
}: {
  gig: GigPreviewData;
  role: string;
  summary: string;
}) {
  const href =
    role === "guest"
      ? "/get-started"
      : `/provider-profile/${gig.providerId}?role=${role}`;

  return (
    <Link href={href}>
      <article className="flex h-full cursor-pointer flex-col rounded-[26px] border border-slate-200 bg-[linear-gradient(135deg,rgba(255,255,255,0.99),rgba(243,248,255,0.95))] p-5 shadow-[0_16px_34px_rgba(15,23,42,0.05)] transition hover:border-[#1453c4]/45 hover:shadow-[0_18px_38px_rgba(20,83,196,0.08)]">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[20px] bg-[linear-gradient(135deg,#2f66e7,#5c86ff)] text-base font-bold text-white shadow-[0_16px_30px_rgba(47,102,231,0.2)]">
            {getInitials(gig.providerName)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
              Provider profile
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2.5">
              <h2 className="text-[1.08rem] font-bold text-[#1453c4] hover:underline">{gig.providerName}</h2>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#1453c4]">
                <CheckCircleIcon className="h-3.5 w-3.5" />
                Verified Provider
              </span>
            </div>
            <p className="mt-1.5 break-words text-sm leading-6 text-slate-600">
              {gig.university} <span className="px-1.5 text-slate-300">|</span> {gig.providerDegree}
              <span className="px-1.5 text-slate-300">|</span> {gig.proficiency}
            </p>
            <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-teal-700">
              <StarIcon className="h-3.5 w-3.5" />
              {gig.reviews > 0 ? `${formatRatingLabel(gig.rating)} (${gig.reviews} reviews)` : "New"}
            </p>
          </div>
        </div>
        <div className="mt-4 border-t border-slate-200 pt-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
            About this gig
          </p>
          <p className="mt-2 line-clamp-4 overflow-hidden break-words text-sm leading-7 text-slate-700">
            {summary}
          </p>
        </div>
      </article>
    </Link>
  );
}

function PackageCard({
  gig,
  packageItems,
  chatHref,
  isOwnGig,
  editHref,
  requesting,
  onRequestNow,
  onMessageProvider,
}: {
  gig: GigPreviewData;
  packageItems: string[];
  chatHref: string;
  isOwnGig: boolean;
  editHref: string;
  requesting: boolean;
  onRequestNow: () => void;
  onMessageProvider: (event: MouseEvent<HTMLAnchorElement>) => void;
}) {
  return (
    <article className="flex flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_18px_42px_rgba(15,23,42,0.08)] xl:max-h-[calc(100vh-1.5rem)]">
      <div className="bg-[linear-gradient(135deg,#1453c4,#2f66e7)] px-4 py-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-100">
          Student swap package
        </p>
        <p className="mt-1.5 text-[1.08rem] font-black leading-tight text-white">Premium Student Swap</p>
        <p className="mt-1.5 text-[12px] font-medium leading-5 text-blue-100">
          Clear pricing, quick communication, and focused student-to-student support.
        </p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col space-y-3 p-3">
        <div className="rounded-[18px] border border-slate-100 bg-[linear-gradient(180deg,#f8fbff,#ffffff)] p-3 shadow-[0_10px_22px_rgba(15,23,42,0.03)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Price</p>
              <p className="mt-1 text-[1.35rem] font-black leading-none text-slate-950">{formatPrice(gig.price)}</p>
            </div>
            <p className="inline-flex items-center gap-1 rounded-full border border-emerald-100 bg-white px-2.5 py-1 text-[11px] font-semibold text-teal-700 shadow-sm">
              <ClockIcon className="h-3 w-3" /> {gig.delivery}
            </p>
          </div>

          <p className="mt-2 line-clamp-2 break-words text-[13px] leading-5 text-slate-600">{gig.summary}</p>
        </div>

        <ul className="space-y-1.5 border-y border-slate-200 py-3 text-[13px] text-slate-700">
          {packageItems.map((item) => (
            <li key={item} className="flex items-start gap-2.5">
              <CheckCircleIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-700" />
              <span className="leading-5">{item}</span>
            </li>
          ))}
        </ul>

        <div className="mt-auto space-y-2">
          {isOwnGig ? (
            <Link
              href={editHref}
              className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-[#1453c4] px-4 text-sm font-bold text-white transition hover:bg-[#0f43a1]"
            >
              Edit Gig Settings
            </Link>
          ) : (
            <>
              <button
                type="button"
                onClick={onRequestNow}
                disabled={requesting}
                className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-[#1453c4] px-4 text-sm font-bold text-white transition hover:bg-[#0f43a1]"
              >
                {requesting ? "Creating Request..." : "Request Now"}
              </button>
              <Link
                href={chatHref}
                onClick={onMessageProvider}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <MailIcon className="h-4 w-4" />
                Message Provider
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="bg-[#f1f4ff] px-4 py-2 text-center text-[10px] font-semibold text-slate-500">
        SkillSwap Quality Guarantee
      </div>
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
    <article className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)] lg:p-6">
      <h3 className={`flex items-center gap-2 text-base font-bold ${titleClass}`}>
        {icon}
        {title}
      </h3>
      <ul className="mt-4 space-y-2.5 text-sm leading-6 text-slate-700">
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

function ReviewsSection({ reviews }: { reviews: ReviewData[] }) {
  if (reviews.length === 0) {
    return (
      <section className="space-y-3">
        <h2 className="text-[1.4rem] font-bold text-slate-900">Reviews for this service</h2>
        <div className="rounded-[24px] border border-slate-200 bg-white px-5 py-8 text-sm text-slate-500 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
          No ratings or reviews yet.
        </div>
      </section>
    );
  }

  return (
      <section className="space-y-3">
        <h2 className="text-[1.4rem] font-bold text-slate-900">Reviews for this service</h2>
        <div className="grid gap-3 md:grid-cols-2">
        {reviews.slice(0, 2).map((review, index) => (
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
    <ReviewFeedbackCard
      reviewerName={review.name}
      reviewerMeta={review.meta}
      rating={review.rating}
      comment={review.quote}
      serviceTitle={review.serviceTitle}
      serviceCategory={review.serviceCategory}
      contextLabel="Reviewed Gig"
      directionLabel="Buyer Review"
      roleLabel="Completed Swap"
      tone={accent === "teal" ? "teal" : "blue"}
    />
  );
}

function QuickFactsCard({ gig }: { gig: GigPreviewData }) {
  const facts = [
    { label: "Category", value: gig.category },
    { label: "Availability", value: gig.availability },
    { label: "Delivery", value: gig.delivery },
    { label: "Price", value: formatPrice(gig.price) },
  ];

  return (
    <article className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_16px_34px_rgba(15,23,42,0.05)] lg:p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
            Service overview
          </p>
          <h2 className="mt-1.5 text-[1.12rem] font-bold text-slate-900">Gig Details</h2>
        </div>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
          Essentials
        </span>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {facts.map((fact) => (
          <div key={fact.label} className="rounded-[20px] border border-slate-100 bg-[linear-gradient(180deg,#f8fbff,#ffffff)] px-4 py-4 shadow-[0_10px_22px_rgba(15,23,42,0.03)]">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">{fact.label}</p>
            <p className="mt-2 text-[1.02rem] font-semibold leading-7 text-slate-800">{fact.value}</p>
          </div>
        ))}
      </div>
    </article>
  );
}

function inferCategory(skill: string) {
  return inferServiceCategory(skill);
}

function formatPrice(value: number | string | undefined) {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return "Price on chat";
  return `LKR ${numeric.toLocaleString("en-LK")}`;
}

function slugSegment(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "gig";
}

function formatReviewDateLabel(value: unknown) {
  if (!value) return "Completed swap review";

  const rawDate = value as { toDate?: () => Date } | Date | string | number;
  const date =
    typeof (rawDate as { toDate?: () => Date }).toDate === "function"
      ? (rawDate as { toDate: () => Date }).toDate()
      : new Date(rawDate as string | number | Date);

  if (Number.isNaN(date.getTime())) {
    return "Completed swap review";
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
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
