"use client";

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { type UserProfile } from "@/lib/auth";
import { scopedHref } from "@/lib/role-routes";
import { UNIVERSITIES } from "@/lib/universities";
import { createNotification } from "@/lib/notifications";
import UniversityCombobox from "@/components/ui/university-combobox";
import SelectField from "@/components/ui/select-field";

type IncomingRequestsTab = "new" | "accepted" | "completed" | "declined";

type IncomingRequestsPageContentProps = {
  activeTab?: IncomingRequestsTab;
  role?: "provider" | "both";
};

interface RequestData {
  id: string;
  buyerId: string;
  buyerName: string;
  buyerProfileImageUrl?: string;
  buyerUniversity: string;
  buyerDegree: string;
  buyerYearOfStudy: string;
  title: string;
  category: string;
  description: string;
  level: string;
  serviceType: string;
  time: string;
  budget: string;
  status: string;
  providerId?: string;
  providerName?: string;
  revisionNotes?: string;
  review?: {
    rating: number;
    comment: string;
  };
  providerReview?: {
    rating: number;
    comment: string;
  };
}

export default function IncomingRequestsPageContent({
  activeTab = "new",
  role = "provider",
}: IncomingRequestsPageContentProps) {
  const { userProfile, loading } = useAuth();
  const [requests, setRequests] = useState<RequestData[]>([]);
  const [fetching, setFetching] = useState(true);

  // Keep both direct and open requests live without making the provider refresh.
  useEffect(() => {
    if (!userProfile) return;

    // Direct requests were sent to this provider from their profile or gig.
    const specificProviderQuery = query(
      collection(db, "requests"),
      where("providerId", "==", userProfile.uid),
    );

    // General requests are open opportunities that any provider can accept.
    const generalRequestsQuery = query(
      collection(db, "requests"),
      where("providerId", "==", "general"),
    );

    const mergedRequests: Map<string, RequestData> = new Map();

    // Each listener updates its own list, then the page merges them below.
    const unsubscribeSpecific = onSnapshot(
      specificProviderQuery,
      (snapshot) => {
        snapshot.forEach((docSnap) => {
          mergedRequests.set(
            docSnap.id,
            { id: docSnap.id, ...docSnap.data() } as RequestData,
          );
        });
        void updateMergedRequests();
      },
      (err) => {
        console.error("Error subscribing to specific requests:", err);
        setFetching(false);
      },
    );

    // The second listener follows the shared request board.
    const unsubscribeGeneral = onSnapshot(
      generalRequestsQuery,
      (snapshot) => {
        snapshot.forEach((docSnap) => {
          mergedRequests.set(
            docSnap.id,
            { id: docSnap.id, ...docSnap.data() } as RequestData,
          );
        });
        void updateMergedRequests();
      },
      (err) => {
        console.error("Error subscribing to general requests:", err);
        setFetching(false);
      },
    );

    const updateMergedRequests = async () => {
      const docs = Array.from(mergedRequests.values()).filter(
        (request) =>
          !(
            request.providerId === "general" &&
            request.buyerId === userProfile.uid
          ),
      );

      const buyerImageEntries = await Promise.all(
        docs.map(async (request) => {
          if (!request.buyerId) return [request.buyerId, ""] as const;
          try {
            const buyerSnapshot = await getDoc(doc(db, "users", request.buyerId));
            const buyerData = buyerSnapshot.exists()
              ? (buyerSnapshot.data() as { profileImageUrl?: string })
              : null;
            return [request.buyerId, buyerData?.profileImageUrl || ""] as const;
          } catch (err) {
            console.error("Error fetching buyer profile image:", err);
            return [request.buyerId, ""] as const;
          }
        }),
      );

      const buyerImageMap = new Map(buyerImageEntries);
      const hydratedDocs = docs.map((request) => ({
        ...request,
        buyerProfileImageUrl: buyerImageMap.get(request.buyerId) || "",
      }));
      hydratedDocs.sort((a, b) => b.id.localeCompare(a.id));
      setRequests(hydratedDocs);
      setFetching(false);
    };

    return () => {
      unsubscribeSpecific();
      unsubscribeGeneral();
    };
  }, [userProfile]);

  const tabHref = (tab: IncomingRequestsTab) => `?tab=${tab}`;

  if (loading || fetching) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#2b62e6] border-t-transparent" />
          <p className="text-sm text-slate-500">Loading incoming requests...</p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">
          Please sign in to view skill requests.
        </p>
      </div>
    );
  }

  return (
    <section className="space-y-6 pb-10">
      {/* Page summary */}
      <header>
        <h1 className="text-xl font-bold text-slate-900">Skill Requests</h1>
        <p className="mt-1 text-xs text-slate-500">
          Manage requests from students needing your expertise.
        </p>
      </header>

      {/* Request status navigation */}
      <div className="flex items-center gap-6 border-b border-slate-200">
        <TabLink
          href={tabHref("new")}
          label="New Requests"
          active={activeTab === "new"}
        />
        <TabLink
          href={tabHref("accepted")}
          label="Accepted / In Progress"
          active={activeTab === "accepted"}
        />
        <TabLink
          href={tabHref("completed")}
          label="Completed"
          active={activeTab === "completed"}
        />
        <TabLink
          href={tabHref("declined")}
          label="Declined"
          active={activeTab === "declined"}
        />
      </div>

      {/* Only the selected workflow stage is rendered below. */}
      {activeTab === "new" && (
        <NewRequestsView
          requests={requests.filter((r) => r.status === "pending")}
          role={role}
          userProfile={userProfile}
        />
      )}
      {activeTab === "accepted" && (
        <AcceptedView
          requests={requests.filter(
            (r) =>
              r.status === "working" ||
              r.status === "revision" ||
              r.status === "done" ||
              r.status === "review_pending" ||
              (r.status === "completed" &&
                Boolean(r.review) &&
                !r.providerReview),
          )}
          role={role}
        />
      )}
      {activeTab === "completed" && (
        <CompletedView
          requests={requests.filter(
            (r) =>
              r.status === "completed" &&
              Boolean(r.review) &&
              Boolean(r.providerReview),
          )}
        />
      )}
      {activeTab === "declined" && (
        <DeclinedView
          requests={requests.filter((r) => r.status === "rejected")}
        />
      )}
    </section>
  );
}

function TabLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`border-b-2 pb-2.5 text-sm font-semibold ${
        active
          ? "border-[#1453c4] text-[#1453c4]"
          : "border-transparent text-slate-500 hover:text-slate-700"
      }`}
    >
      {label}
    </Link>
  );
}

function NewRequestsView({
  requests,
  role,
  userProfile,
}: {
  requests: RequestData[];
  role: "provider" | "both";
  userProfile: UserProfile | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const categoryOptions = [
    "All Categories",
    "Programming",
    "UX Design",
    "Graphic Design",
    "Mathematics",
    "Photography",
    "Video Editing",
    "Data Analysis",
    "Web Development",
    "Content Writing",
    "Music",
  ];
  const universityOptions = ["Any University", ...UNIVERSITIES];
  const [category, setCategory] = useState(
    searchParams.get("category") || "All Categories",
  );
  const [university, setUniversity] = useState(
    searchParams.get("university") || "Any University",
  );

  useEffect(() => {
    const nextCategory = searchParams.get("category") || "All Categories";
    const nextUniversity = searchParams.get("university") || "Any University";

    setCategory(
      categoryOptions.includes(nextCategory) ? nextCategory : "All Categories",
    );
    setUniversity(
      universityOptions.includes(nextUniversity)
        ? nextUniversity
        : "Any University",
    );
  }, [searchParams]);

  // Apply the selected tab and search text before rendering the cards.
  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      const categoryOk =
        category === "All Categories" || request.category === category;
      const universityOk =
        university === "Any University" ||
        request.buyerUniversity
          .toLowerCase()
          .includes(university.toLowerCase()) ||
        university
          .toLowerCase()
          .includes(request.buyerUniversity.toLowerCase());
      return categoryOk && universityOk;
    });
  }, [requests, category, university]);

  const hasActiveFilters =
    category !== "All Categories" || university !== "Any University";

  const updateFilters = (
    nextCategory: string,
    nextUniversity: string,
  ) => {
    const params = new URLSearchParams(searchParams.toString());

    if (nextCategory === "All Categories") {
      params.delete("category");
    } else {
      params.set("category", nextCategory);
    }

    if (nextUniversity === "Any University") {
      params.delete("university");
    } else {
      params.set("university", nextUniversity);
    }

    const nextQuery = params.toString();
    router.push(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
      scroll: false,
    });
  };

  const handleDecision = async (
    reqId: string,
    status: "working" | "rejected",
  ) => {
    try {
      const reqObj = requests.find((r) => r.id === reqId);
      const updateData: {
        status: string;
        updatedAt: unknown;
        providerId?: string;
        providerName?: string;
      } = {
        status,
        updatedAt: serverTimestamp(),
      };
      if (status === "working" && userProfile) {
        updateData.providerId = userProfile.uid;
        updateData.providerName = userProfile.name || "Provider Partner";
      }
      await updateDoc(doc(db, "requests", reqId), updateData);

      if (reqObj) {
        const actionText = status === "working" ? "accepted" : "declined";
        await createNotification({
          userId: reqObj.buyerId,
          title: status === "working" ? "Swap Request Accepted" : "Swap Request Declined",
          description: `${userProfile?.name || "Provider"} has ${actionText} your swap request for "${reqObj.title}"`,
          type: "request",
          icon: status === "working" ? "✓" : "!",
          tone: status === "working" ? "green" : "red",
        });
      }
    } catch (err) {
      console.error(`Error updating request status to ${status}:`, err);
    }
  };

  return (
    <div className="space-y-5">
      <article className="rounded-2xl border border-slate-200 bg-[#f7f8ff] p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-center">
          <div className="grid w-full gap-4 md:grid-cols-2 xl:max-w-3xl">
            <Field
              label="Category"
              value={category}
              options={categoryOptions}
              fieldClassName="min-h-10 text-sm font-medium"
              onChange={(nextCategory) => {
                setCategory(nextCategory);
                updateFilters(nextCategory, university);
              }}
            />
            <Field
              label="University"
              value={university}
              options={universityOptions}
              fieldClassName="min-h-10 text-sm font-medium"
              onChange={(nextUniversity) => {
                setUniversity(nextUniversity);
                updateFilters(category, nextUniversity);
              }}
            />
          </div>
        </div>
      </article>

      {filteredRequests.length > 0 ? (
        <div className="grid items-start gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {filteredRequests.map((request) => {
            const isGeneralRequest = request.providerId === "general";

            return (
              <article
                key={request.id}
                className="flex h-[380px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 text-sm font-bold text-slate-800 ${
                        hasActiveFilters
                          ? "border-[#2f66e7] bg-blue-100"
                          : "border-emerald-500 bg-emerald-50"
                      }`}
                    >
                      {request.buyerProfileImageUrl ? (
                        <img
                          src={request.buyerProfileImageUrl}
                          alt={request.buyerName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        request.buyerName.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-base font-bold leading-5 text-slate-900">
                        {request.buyerName}
                      </p>
                      <p className="truncate text-xs leading-5 text-slate-500">
                        {request.buyerDegree}
                      </p>
                      <p className="truncate whitespace-nowrap text-xs leading-5 text-slate-500">
                        {request.buyerUniversity} ({request.buyerYearOfStudy})
                      </p>
                    </div>
                  </div>
                  <div className="flex min-h-6 shrink-0 items-start">
                    {hasActiveFilters ? (
                      <span className="group relative inline-flex h-5 w-5 items-center justify-center">
                        <span className="h-2.5 w-2.5 rounded-full bg-[#1453c4]" />
                        <span className="pointer-events-none absolute right-0 top-6 z-10 whitespace-nowrap rounded-md bg-[#1453c4] px-2 py-1 text-[10px] font-semibold text-white opacity-0 shadow-sm transition group-hover:opacity-100">
                          Matched
                        </span>
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="flex min-h-0 flex-1 flex-col pt-3">
                  <span className="inline-flex w-fit rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-[#1453c4]">
                    {request.category}
                  </span>
                  <div className="mt-3 flex items-baseline gap-2">
                    <p className="line-clamp-2 text-[15px] font-extrabold leading-5 text-[#1453c4]">
                      {request.title}
                    </p>
                    <p className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      Skill Needed
                    </p>
                  </div>

                  <div className="relative mt-3 min-h-0 flex-1 overflow-hidden">
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-5 bg-gradient-to-t from-white via-white/85 to-transparent" />
                    <div className="min-h-0 flex h-full flex-col space-y-3 overflow-y-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <p className="line-clamp-3 text-sm leading-6 text-slate-600">
                      {request.description}
                    </p>

                    <div className="grid grid-cols-2 gap-2 rounded-xl bg-[#f7f8ff] p-2.5 text-[11px] text-slate-600">
                      <div className="min-w-0 rounded-lg bg-white/70 px-2.5 py-2">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          Time
                        </p>
                        <p className="mt-1 truncate font-semibold text-slate-700">
                          {request.time}
                        </p>
                      </div>
                      <div className="min-w-0 rounded-lg bg-white/70 px-2.5 py-2">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          Type
                        </p>
                        <p className="mt-1 truncate font-semibold text-slate-700">
                          {request.serviceType}
                        </p>
                      </div>
                      <div className="min-w-0 rounded-lg bg-white/70 px-2.5 py-2">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          Budget
                        </p>
                        <p className="mt-1 truncate font-semibold text-slate-700">
                          {request.budget}
                        </p>
                      </div>
                      <div className="min-w-0 rounded-lg bg-white/70 px-2.5 py-2">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          Level
                        </p>
                        <p className="mt-1 truncate font-semibold text-slate-700">
                          {request.level}
                        </p>
                      </div>
                    </div>
                    </div>
                  </div>

                  <div
                    className={`mt-3 grid gap-2 border-t border-slate-100 pt-3 ${
                      isGeneralRequest ? "grid-cols-2" : "grid-cols-3"
                    }`}
                  >
                    <button
                      onClick={() => handleDecision(request.id, "working")}
                      className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700"
                    >
                      Accept Swap
                    </button>
                    {!isGeneralRequest && (
                      <button
                        onClick={() => handleDecision(request.id, "rejected")}
                        className="rounded-lg border border-red-300 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50"
                      >
                        Decline
                      </button>
                    )}
                    <Link
                      href={`${scopedHref("/chats", role)}?peerId=${encodeURIComponent(request.buyerId)}&subject=${encodeURIComponent(request.title)}`}
                      className="inline-flex items-center justify-center rounded-lg border border-[#1453c4] px-3 py-2 text-xs font-bold text-[#1453c4] transition hover:bg-blue-50"
                    >
                      Chat
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-sm">
          No incoming skill swap requests match the current filters.
        </div>
      )}
    </div>
  );
}
function AcceptedView({
  requests,
  role,
}: {
  requests: RequestData[];
  role: "provider" | "both";
}) {
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [providerRating, setProviderRating] = useState(5);
  const [providerComment, setProviderComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleMarkDone = async (reqId: string) => {
    try {
      const reqObj = requests.find((r) => r.id === reqId);
      await updateDoc(doc(db, "requests", reqId), {
        status: "done",
        updatedAt: serverTimestamp(),
      });

      if (reqObj) {
        await createNotification({
          userId: reqObj.buyerId,
          title: "Session Finished",
          description: `Provider marked the session "${reqObj.title}" as complete. Please accept and review.`,
          type: "request",
          icon: "✓",
          tone: "teal",
        });
      }
    } catch (err) {
      console.error("Error setting request status to done:", err);
    }
  };

  const submitProviderReview = async (reqId: string) => {
    if (!providerComment.trim()) return;
    setSubmitting(true);
    try {
      const reqObj = requests.find((r) => r.id === reqId);
      await updateDoc(doc(db, "requests", reqId), {
        status: "completed",
        providerReview: {
          rating: providerRating,
          comment: providerComment.trim(),
        },
        updatedAt: serverTimestamp(),
      });

      if (reqObj) {
        await createNotification({
          userId: reqObj.buyerId,
          title: "New Review Received",
          description: `Provider left you a review: "${providerComment.trim().slice(0, 60)}..."`,
          type: "review",
          icon: "★",
          tone: "emerald",
        });
      }

      setReviewingId(null);
      setProviderComment("");
      setProviderRating(5);
    } catch (err) {
      console.error("Error submitting provider review:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {requests.length > 0 ? (
        requests.map((item) => {
          const needsProviderReview =
            item.status === "review_pending" ||
            (item.status === "completed" &&
              Boolean(item.review) &&
              !item.providerReview);
          return (
            <article
              key={item.id}
              className={`rounded-xl border bg-white p-5 shadow-sm transition border-slate-200 ${
                item.status === "revision" ? "ring-2 ring-rose-500/50" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-2.5">
                <div>
                  <p className="text-xs font-bold leading-tight text-slate-900">
                    {item.buyerName}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {item.buyerUniversity}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                    item.status === "revision"
                      ? "bg-rose-100 text-rose-800"
                      : needsProviderReview
                        ? "bg-amber-100 text-amber-800"
                        : item.status === "done"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-teal-100 text-teal-800"
                  }`}
                >
                  {item.status === "revision"
                    ? "Needs Update"
                    : needsProviderReview
                      ? "Review Buyer"
                      : item.status === "done"
                        ? "Finished"
                        : "Working"}
                </span>
              </div>

              <p className="mt-2.5 text-[9px] font-bold uppercase tracking-wide text-slate-400">
                Requested Skill
              </p>
              <p className="mt-0.5 text-xs font-bold text-[#1453c4]">
                {item.title}
              </p>

              <p className="mt-2 text-xs leading-5 text-slate-600 line-clamp-2">
                {item.description}
              </p>

              {/* Revision Alert Box */}
              {item.status === "revision" && item.revisionNotes && (
                <div className="mt-3 rounded-lg bg-rose-50 border border-rose-100 p-2.5 text-xs text-rose-700">
                  <strong className="block font-bold">
                    ⚠️ Buyer Update Requests:
                  </strong>
                  &ldquo;{item.revisionNotes}&rdquo;
                </div>
              )}

              {needsProviderReview && item.review && (
                <div className="mt-3 rounded-lg bg-amber-50/50 border border-amber-100 p-2.5 text-xs text-slate-700">
                  <strong className="block font-bold">Buyer Review:</strong>
                  <span className="text-amber-500 font-bold">
                    {"★".repeat(item.review.rating)}
                    {"☆".repeat(5 - item.review.rating)}
                  </span>
                  <p className="mt-1 italic">
                    &ldquo;{item.review.comment}&rdquo;
                  </p>
                </div>
              )}

              <div className="mt-3 rounded-lg bg-[#f3f4ff] p-2.5 text-xs text-slate-600">
                <span className="font-semibold">Budget: {item.budget}</span>
                <span className="mx-2">|</span>
                <span className="font-semibold">Preferred: {item.time}</span>
              </div>

              <div className="mt-4 flex flex-col gap-2">
                {item.status !== "done" && !needsProviderReview && (
                  <button
                    onClick={() => handleMarkDone(item.id)}
                    className="rounded-lg bg-emerald-600 hover:bg-emerald-700 py-2 text-xs font-bold text-white shadow-xs"
                  >
                    ✓ Mark as Done
                  </button>
                )}
                {needsProviderReview &&
                  (reviewingId === item.id ? (
                    <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-3 space-y-2.5">
                      <p className="text-xs font-bold text-blue-800">
                        Review Buyer: {item.buyerName}
                      </p>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setProviderRating(s)}
                            className={`text-lg leading-none ${s <= providerRating ? "text-amber-400" : "text-slate-300"}`}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                      <textarea
                        rows={3}
                        value={providerComment}
                        onChange={(e) => setProviderComment(e.target.value)}
                        placeholder="Share your experience with this buyer..."
                        className="w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-[#2f66e7] focus:ring-2 focus:ring-blue-100"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => submitProviderReview(item.id)}
                          disabled={submitting || !providerComment.trim()}
                          className="flex-1 rounded-lg bg-[#2f66e7] py-1.5 text-xs font-bold text-white hover:bg-[#2557cf] disabled:opacity-50"
                        >
                          {submitting ? "Saving..." : "Submit & Complete"}
                        </button>
                        <button
                          onClick={() => {
                            setReviewingId(null);
                            setProviderComment("");
                            setProviderRating(5);
                          }}
                          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setReviewingId(item.id)}
                      className="rounded-lg border border-dashed border-[#2f66e7] bg-blue-50/30 py-2 text-xs font-bold text-[#2f66e7] hover:bg-blue-50 transition-colors"
                    >
                      + Leave Review for Buyer
                    </button>
                  ))}
                <div className="flex gap-2">
                  <Link
                    href={`${scopedHref("/chats", role)}?peerId=${encodeURIComponent(item.buyerId)}&subject=${encodeURIComponent(item.title)}`}
                    className="flex-1 rounded-lg border border-[#1453c4] px-3 py-2 text-center text-xs font-semibold text-[#1453c4] hover:bg-blue-50"
                  >
                    Chat
                  </Link>
                  <span className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-center text-xs font-semibold text-slate-500 bg-slate-50 select-none">
                    {needsProviderReview
                      ? "Buyer Reviewed"
                      : item.status === "done"
                        ? "Awaiting Buyer Review"
                        : "In Progress"}
                  </span>
                </div>
              </div>
            </article>
          );
        })
      ) : (
        <div className="col-span-full rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-sm">
          No accepted or active requests at this time.
        </div>
      )}
    </div>
  );
}

function CompletedView({ requests }: { requests: RequestData[] }) {
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [providerRating, setProviderRating] = useState(5);
  const [providerComment, setProviderComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submitProviderReview = async (reqId: string) => {
    if (!providerComment.trim()) return;
    setSubmitting(true);
    try {
      const reqObj = requests.find((r) => r.id === reqId);
      await updateDoc(doc(db, "requests", reqId), {
        providerReview: {
          rating: providerRating,
          comment: providerComment.trim(),
        },
        updatedAt: serverTimestamp(),
      });

      if (reqObj) {
        await createNotification({
          userId: reqObj.buyerId,
          title: "New Review Received",
          description: `Provider left you a review: "${providerComment.trim().slice(0, 60)}..."`,
          type: "review",
          icon: "★",
          tone: "emerald",
        });
      }

      setReviewingId(null);
      setProviderComment("");
      setProviderRating(5);
    } catch (err) {
      console.error("Error submitting provider review:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {requests.length > 0 ? (
        requests.map((item) => (
          <article
            key={item.id}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-2.5">
              <div>
                <p className="text-xs font-bold text-slate-900">
                  {item.buyerName}
                </p>
                <p className="text-[10px] text-slate-400">
                  {item.buyerUniversity}
                </p>
              </div>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-800">
                Completed
              </span>
            </div>

            <p className="mt-3.5 text-[9px] font-bold uppercase tracking-wide text-slate-400">
              Exchanged Skill
            </p>
            <p className="mt-0.5 text-xs font-bold text-emerald-700">
              {item.title}
            </p>

            {/* Buyer review of provider */}
            {item.review ? (
              <div className="mt-3.5 rounded-lg bg-amber-50/50 border border-amber-100 p-3">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-xs text-slate-700">
                    {"Buyer's Review"}
                  </p>
                  <p className="text-amber-500 font-bold text-xs">
                    {"★".repeat(item.review.rating)}
                    {"☆".repeat(5 - item.review.rating)}
                  </p>
                </div>
                <p className="mt-1 italic text-xs text-slate-600 leading-relaxed">
                  &ldquo;{item.review.comment}&rdquo;
                </p>
              </div>
            ) : (
              <div className="mt-3.5 rounded-lg bg-slate-50 p-3 text-xs italic text-slate-400">
                Buyer has not reviewed yet.
              </div>
            )}

            {/* Provider review of buyer */}
            {item.providerReview ? (
              <div className="mt-2.5 rounded-lg bg-blue-50/60 border border-blue-100 p-3">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-xs text-blue-700">
                    Your Review of Buyer
                  </p>
                  <p className="text-blue-400 font-bold text-xs">
                    {"★".repeat(item.providerReview.rating)}
                    {"☆".repeat(5 - item.providerReview.rating)}
                  </p>
                </div>
                <p className="mt-1 italic text-xs text-slate-600 leading-relaxed">
                  &ldquo;{item.providerReview.comment}&rdquo;
                </p>
              </div>
            ) : reviewingId === item.id ? (
              <div className="mt-2.5 rounded-xl border border-blue-200 bg-blue-50/40 p-3 space-y-2.5">
                <p className="text-xs font-bold text-blue-800">
                  Review Buyer: {item.buyerName}
                </p>
                {/* Star rating */}
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setProviderRating(s)}
                      className={`text-lg leading-none ${s <= providerRating ? "text-amber-400" : "text-slate-300"}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <textarea
                  rows={3}
                  value={providerComment}
                  onChange={(e) => setProviderComment(e.target.value)}
                  placeholder="Share your experience with this buyer..."
                  className="w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-[#2f66e7] focus:ring-2 focus:ring-blue-100"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => submitProviderReview(item.id)}
                    disabled={submitting || !providerComment.trim()}
                    className="flex-1 rounded-lg bg-[#2f66e7] py-1.5 text-xs font-bold text-white hover:bg-[#2557cf] disabled:opacity-50"
                  >
                    {submitting ? "Saving..." : "Submit Review"}
                  </button>
                  <button
                    onClick={() => {
                      setReviewingId(null);
                      setProviderComment("");
                      setProviderRating(5);
                    }}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setReviewingId(item.id)}
                className="mt-2.5 w-full rounded-lg border border-dashed border-[#2f66e7] bg-blue-50/30 py-1.5 text-xs font-bold text-[#2f66e7] hover:bg-blue-50 transition-colors"
              >
                + Leave Review for Buyer
              </button>
            )}
          </article>
        ))
      ) : (
        <div className="col-span-full rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-sm">
          No completed swap history found.
        </div>
      )}
    </div>
  );
}

function DeclinedView({ requests }: { requests: RequestData[] }) {
  return (
    <section className="space-y-4">
      {requests.length > 0 ? (
        requests.map((item) => (
          <article
            key={item.id}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-200 bg-white p-5 gap-4 shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-100 text-lg font-bold text-slate-600">
                {item.buyerName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">
                  {item.buyerName}
                </p>
                <p className="text-xs text-slate-500">{item.title}</p>
                <p className="mt-1 text-xs text-slate-500">
                  Declined Direct Skill Swap Request
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 self-end sm:self-auto">
              <span className="rounded bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 border border-rose-100">
                Declined
              </span>
            </div>
          </article>
        ))
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-sm">
          No declined requests found.
        </div>
      )}
    </section>
  );
}

function Field({
  label,
  value,
  options,
  onChange,
  fieldClassName = "",
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  fieldClassName?: string;
}) {
  const isUniversity = label.toLowerCase() === "university";

  if (isUniversity) {
    return (
      <UniversityCombobox
        label={label}
        value={value}
        onSelect={onChange}
        emptyValue="Any University"
        placeholder="Any University"
        labelClassName="block text-[11px] font-bold uppercase tracking-wider text-slate-500"
        className={fieldClassName}
      />
    );
  }

  return (
    <SelectField
      label={label}
      value={value}
      onChange={onChange}
      options={options}
      labelClassName="text-[11px] font-bold uppercase tracking-wider text-slate-500"
      className={`h-10 px-2.5 text-xs font-semibold text-slate-700 ${fieldClassName}`}
    />
  );
}

