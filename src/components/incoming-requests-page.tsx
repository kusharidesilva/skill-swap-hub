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
import { createNotification } from "@/lib/notifications";
import SelectField from "@/components/ui/select-field";
import { useLookupOptions } from "@/lib/lookups";
import { ensureGigTitlePrefix } from "@/lib/gig-titles";

type IncomingRequestsTab = "new" | "accepted" | "completed" | "declined";

type IncomingRequestsPageContentProps = {
  activeTab?: IncomingRequestsTab;
  role?: "provider" | "both";
};

interface RequestData { 
  id: string; 
  sourceCollection?: "requests" | "directServiceRequests";
  buyerId: string; 
  buyerName: string; 
  buyerProfileImageUrl?: string;
  buyerAccountType?: string;
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

type BuyerRequestMeta = {
  profileImageUrl: string;
  accountType: string;
  university: string;
  degree: string;
  yearOfStudy: string;
};

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

    const directRequestsQuery = query(
      collection(db, "directServiceRequests"),
      where("providerId", "==", userProfile.uid),
    );

    const specificRequests = new Map<string, RequestData>();
    const generalRequests = new Map<string, RequestData>();
    const directRequests = new Map<string, RequestData>();

    const normalizeDirectRequestStatus = (status?: string) => {
      switch ((status || "").toLowerCase()) {
        case "active":
        case "pending":
          return "pending";
        case "working":
        case "accepted":
        case "in_progress":
          return "working";
        case "done":
          return "done";
        case "review_pending":
          return "review_pending";
        case "completed":
          return "completed";
        case "rejected":
        case "declined":
          return "rejected";
        default:
          return "pending";
      }
    };

    const updateMergedRequests = async () => {
      const docs = [
        ...specificRequests.values(),
        ...generalRequests.values(),
        ...directRequests.values(),
      ].filter(
        (request) =>
          !(
            request.providerId === "general" &&
            request.buyerId === userProfile.uid
          ),
      );

      const buyerImageEntries = await Promise.all(
        docs.map(async (request) => {
          if (!request.buyerId) {
            return [
              request.buyerId,
              {
                profileImageUrl: "",
                accountType: "",
                university: "",
                degree: "",
                yearOfStudy: "",
              },
            ] as const;
          }
          try {
            const buyerSnapshot = await getDoc(doc(db, "users", request.buyerId));
            const buyerData = buyerSnapshot.exists()
              ? (buyerSnapshot.data() as Partial<BuyerRequestMeta>)
              : null;
            return [
              request.buyerId,
              {
                profileImageUrl: buyerData?.profileImageUrl || "",
                accountType: buyerData?.accountType || "",
                university: buyerData?.university || "",
                degree: buyerData?.degree || "",
                yearOfStudy: buyerData?.yearOfStudy || "",
              },
            ] as const;
          } catch (err) {
            console.error("Error fetching buyer profile image:", err);
            return [
              request.buyerId,
              {
                profileImageUrl: "",
                accountType: "",
                university: "",
                degree: "",
                yearOfStudy: "",
              },
            ] as const;
          }
        }),
      );

      const buyerImageMap = new Map<string, BuyerRequestMeta>(buyerImageEntries);
      const hydratedDocs = docs.map((request) => {
        const buyerMeta = buyerImageMap.get(request.buyerId);
        const resolvedBuyerAccountType =
          request.buyerAccountType || buyerMeta?.accountType || "";

        return {
          ...request,
          buyerProfileImageUrl: buyerMeta?.profileImageUrl || "",
          buyerAccountType: resolvedBuyerAccountType,
          buyerUniversity:
            resolvedBuyerAccountType === "non-student"
              ? ""
              : request.buyerUniversity || buyerMeta?.university || "",
          buyerDegree:
            resolvedBuyerAccountType === "non-student"
              ? ""
              : request.buyerDegree || buyerMeta?.degree || "",
          buyerYearOfStudy:
            resolvedBuyerAccountType === "non-student"
              ? ""
              : request.buyerYearOfStudy || buyerMeta?.yearOfStudy || "",
        };
      });
      hydratedDocs.sort((a, b) => b.id.localeCompare(a.id));
      setRequests(hydratedDocs);
      setFetching(false);
    };

    // Each listener updates its own list, then the page merges them below.
    const unsubscribeSpecific = onSnapshot(
      specificProviderQuery,
      (snapshot) => {
        specificRequests.clear();
        snapshot.forEach((docSnap) => {
          specificRequests.set(
            docSnap.id,
            { id: docSnap.id, sourceCollection: "requests", ...docSnap.data() } as RequestData,
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
        generalRequests.clear();
        snapshot.forEach((docSnap) => {
          generalRequests.set(
            docSnap.id,
            { id: docSnap.id, sourceCollection: "requests", ...docSnap.data() } as RequestData,
          );
        });
        void updateMergedRequests();
      },
      (err) => {
        console.error("Error subscribing to general requests:", err);
        setFetching(false);
      },
    );

    const unsubscribeDirect = onSnapshot(
      directRequestsQuery,
      (snapshot) => {
        directRequests.clear();
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          directRequests.set(docSnap.id, {
            id: docSnap.id,
            sourceCollection: "directServiceRequests",
            buyerId: data.buyerUserId || "",
            buyerName: data.buyerName || "Buyer",
            buyerUniversity: "",
            buyerDegree: "",
            buyerYearOfStudy: "",
            title: data.serviceTitle || "Direct Service Request",
            category: data.serviceCategory || "General",
            description: data.message || `Direct request for "${data.serviceTitle || "this gig"}".`,
            level: "Discuss in chat",
            serviceType: "Direct Gig Request",
            time: data.delivery || "Discuss in chat",
            budget: data.price ? `LKR ${data.price}` : "Discuss in chat",
            status: normalizeDirectRequestStatus(data.requestStatus),
            providerId: data.providerId,
            providerName: data.providerName,
          });
        });
        void updateMergedRequests();
      },
      (err) => {
        console.error("Error subscribing to direct requests:", err);
        setFetching(false);
      },
    );

    return () => {
      unsubscribeSpecific();
      unsubscribeGeneral();
      unsubscribeDirect();
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
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Skill Requests</h1>
          <p className="mt-1 text-xs text-slate-500">
            Manage requests from students needing your expertise.
          </p>
        </div>

        {activeTab === "new" ? (
          <HeaderCategoryFilter />
        ) : null}
      </header>

      {/* Request status navigation */}
      <div className="flex flex-wrap items-center gap-5 border-b border-slate-200">
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

function formatBudgetLabel(value: string | undefined) {
  const normalized = (value || "").trim().toLowerCase();

  if (!normalized || normalized === "open budget") {
    return "Discuss in chat";
  }

  return value as string;
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
  const searchParams = useSearchParams();
  const serviceCategories = useLookupOptions("serviceCategories");
  const categoryOptions = ["All Categories", ...serviceCategories];
  const nextCategory = searchParams.get("category") || "All Categories";
  const category = categoryOptions.includes(nextCategory)
    ? nextCategory
    : "All Categories";
  // Apply the selected tab and search text before rendering the cards.
  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      return category === "All Categories" || request.category === category;
    });
  }, [requests, category]);

  const hasActiveFilters = category !== "All Categories";

  const handleDecision = async (
    reqId: string,
    status: "working" | "rejected",
  ) => {
    try {
      const reqObj = requests.find((r) => r.id === reqId);
      const collectionName = reqObj?.sourceCollection || "requests";
      const updateData: {
        status: string;
        updatedAt: unknown;
        providerId?: string;
        providerName?: string;
        requestStatus?: string;
      } = {
        status,
        updatedAt: serverTimestamp(),
      };

      if (collectionName === "directServiceRequests") {
        updateData.requestStatus = status;
      }

      if (status === "working" && userProfile) {
        updateData.providerId = userProfile.uid;
        updateData.providerName = userProfile.name || "Provider Partner";
      }
      await updateDoc(doc(db, collectionName, reqId), updateData);

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
      {filteredRequests.length > 0 ? (
        <div className="grid items-start gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {filteredRequests.map((request) => {
            const isGeneralRequest = request.providerId === "general";
            const buyerStatusLabel =
              request.buyerAccountType === "non-student"
                ? "Verified Buyer"
                : "Verified Student";
            const buyerStatusClassName =
              request.buyerAccountType === "non-student"
                ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                : "border-blue-100 bg-blue-50 text-blue-700";

            return (
              <article
                key={request.id}
                className="group flex min-h-[286px] flex-col overflow-hidden rounded-[22px] border border-slate-200/90 bg-[linear-gradient(180deg,#ffffff_0%,#fbfdff_100%)] p-3.5 shadow-[0_12px_26px_rgba(15,23,42,0.05)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_18px_34px_rgba(15,23,42,0.08)]"
              >
                <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 text-sm font-bold text-slate-800 shadow-sm ${
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
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-[0.98rem] font-bold leading-5 text-slate-900">
                          {request.buyerName}
                        </p>
                        <p className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${buyerStatusClassName}`}>
                          <VerifiedBadgeIcon className="mr-1 h-3 w-3" />
                          {buyerStatusLabel}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex min-h-6 shrink-0 items-start">
                    {hasActiveFilters ? (
                      <span className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-[#1453c4]">
                        Matched
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="flex min-h-0 flex-1 flex-col pt-3">
                  <div className="mt-2.5 flex items-start gap-2">
                    <p className="line-clamp-2 text-[1.08rem] font-black leading-[1.25] tracking-tight text-[#1453c4]">
                      {ensureGigTitlePrefix(request.title)}
                    </p>
                    <span className="mt-0.5 inline-flex shrink-0 rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-[#1453c4]">
                      {request.category}
                    </span>
                  </div>

                  <div className="mt-2.5 rounded-[18px] border border-slate-100 bg-slate-50/75 p-3">
                    <p className="line-clamp-2 text-[12.5px] leading-5 text-slate-600">
                      {request.description}
                    </p>
                  </div>

                  <div className="mt-2.5 grid grid-cols-2 gap-2">
                    <div className="min-w-0 rounded-[16px] border border-slate-100 bg-white px-3 py-2.5 shadow-[0_6px_16px_rgba(15,23,42,0.04)]">
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                        Price
                      </p>
                      <p className="mt-1 text-[12.5px] font-semibold leading-5 text-slate-700">
                        {formatBudgetLabel(request.budget)}
                      </p>
                    </div>
                    <div className="min-w-0 rounded-[16px] border border-slate-100 bg-white px-3 py-2.5 shadow-[0_6px_16px_rgba(15,23,42,0.04)]">
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                        Details
                      </p>
                      <p className="mt-1 text-[12.5px] font-semibold leading-5 text-slate-700">
                        {request.serviceType}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`mt-auto grid gap-2 border-t border-slate-100 pt-3 ${
                      isGeneralRequest ? "grid-cols-2" : "grid-cols-3"
                    }`}
                  >
                    <button
                      onClick={() => handleDecision(request.id, "working")}
                      className="rounded-[14px] bg-emerald-600 px-2 py-2 text-[10.5px] font-bold text-white shadow-[0_10px_20px_rgba(5,150,105,0.16)] transition hover:bg-emerald-700"
                    >
                      Accept Swap
                    </button>
                    {!isGeneralRequest && (
                      <button
                        onClick={() => handleDecision(request.id, "rejected")}
                        className="rounded-[14px] border border-rose-200 bg-white px-2 py-2 text-[10.5px] font-bold text-rose-600 transition hover:bg-rose-50"
                      >
                        Decline
                      </button>
                    )}
                    <Link
                      href={`${scopedHref("/chats", role)}?peerId=${encodeURIComponent(request.buyerId)}&subject=${encodeURIComponent(request.title)}`}
                      className="inline-flex items-center justify-center rounded-[14px] border border-[#c7d7ff] bg-blue-50/60 px-2 py-2 text-[11.5px] font-bold text-[#1453c4] transition hover:border-[#1453c4] hover:bg-blue-50"
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
        <div className="relative z-0 rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-sm">
          No incoming skill swap requests match the current filters.
        </div>
      )}
    </div>
  );
}

function HeaderCategoryFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const serviceCategories = useLookupOptions("serviceCategories");
  const categoryOptions = ["All Categories", ...serviceCategories];
  const nextCategory = searchParams.get("category") || "All Categories";
  const category = categoryOptions.includes(nextCategory)
    ? nextCategory
    : "All Categories";

  const updateFilters = (nextValue: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (nextValue === "All Categories") {
      params.delete("category");
    } else {
      params.set("category", nextValue);
    }

    const nextQuery = params.toString();
    router.push(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
      scroll: false,
    });
  };

  return (
    <div className="flex w-full flex-col gap-2 lg:w-auto lg:min-w-[260px] lg:max-w-[320px]">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
          Category
        </span>
        {category !== "All Categories" ? (
          <button
            type="button"
            onClick={() => updateFilters("All Categories")}
            className="text-[11px] font-semibold text-[#1453c4] transition hover:text-[#0f3f96]"
          >
            Clear
          </button>
        ) : null}
      </div>

      <SelectField
        label="Category"
        value={category}
        onChange={updateFilters}
        options={categoryOptions}
        className="min-h-10 rounded-xl border-slate-200 bg-white text-sm font-medium"
        labelClassName="sr-only"
      />
    </div>
  );
}

function VerifiedBadgeIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3.75 6.75 6v5.1c0 3.4 2.03 6.53 5.25 7.9 3.22-1.37 5.25-4.5 5.25-7.9V6L12 3.75Z" />
      <path d="m9.6 12 1.6 1.6 3.3-3.5" />
    </svg>
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
      const collectionName = reqObj?.sourceCollection || "requests";
      const updateData: Record<string, unknown> = {
        status: "done",
        deliveredAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      if (collectionName === "directServiceRequests") {
        updateData.requestStatus = "done";
      }

      await updateDoc(doc(db, collectionName, reqId), updateData);

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
      const collectionName = reqObj?.sourceCollection || "requests";
      const updateData: Record<string, unknown> = {
        status: "completed",
        providerReview: {
          rating: providerRating,
          comment: providerComment.trim(),
        },
        providerReviewedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      if (collectionName === "directServiceRequests") {
        updateData.requestStatus = "completed";
      }

      await updateDoc(doc(db, collectionName, reqId), updateData);

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
                    {item.buyerAccountType === "non-student"
                      ? "Non-student Buyer"
                      : item.buyerUniversity}
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
                <span className="font-semibold">Budget: {formatBudgetLabel(item.budget)}</span>
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
      const collectionName = reqObj?.sourceCollection || "requests";
      await updateDoc(doc(db, collectionName, reqId), {
        providerReview: {
          rating: providerRating,
          comment: providerComment.trim(),
        },
        providerReviewedAt: serverTimestamp(),
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
                  {item.buyerAccountType === "non-student"
                    ? "Non-student Buyer"
                    : item.buyerUniversity}
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


