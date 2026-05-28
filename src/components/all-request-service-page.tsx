"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { scopedHref, type Role } from "@/lib/role-routes";

type RequestCardData = {
  id: string;
  title: string;
  subject: string;
  status: string;
  statusTone: "teal" | "slate" | "red";
  iconTone: "teal" | "amber" | "blue" | "red";
  meta: [string, string];
  primaryLabel: string;
  secondaryLabel: string;
  isAlert?: boolean;
};

type FilterKey =
  | "All Requests"
  | "Pending"
  | "Matched"
  | "Completed"
  | "Declined";

const tips = [
  {
    title: "Be Descriptive",
    body: "Clearly state what you want to learn and your current level.",
    icon: DocumentIcon,
  },
  {
    title: "Set Availability",
    body: "Specify your preferred meeting times for quicker matching.",
    icon: ClockIcon,
  },
  {
    title: "Offer a Skill",
    body: "Students who offer skills get matched 3x faster.",
    icon: HandHeartIcon,
  },
];

type AllRequestServicePageProps = {
  role?: Role;
};

export default function AllRequestServicePage({
  role = "buyer",
}: AllRequestServicePageProps) {
  const { userProfile, loading: authLoading } = useAuth();
  const [activeFilter, setActiveFilter] = useState<FilterKey>("All Requests");
  const [requestState, setRequestState] = useState<{
    uid: string;
    requests: RequestCardData[];
  } | null>(null);

  useEffect(() => {
    if (!userProfile) {
      return;
    }

    const q = query(
      collection(db, "requests"),
      where("buyerId", "==", userProfile.uid),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs: RequestCardData[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();

          let statusTone: "teal" | "slate" | "red" = "slate";
          let iconTone: "teal" | "amber" | "blue" | "red" = "blue";
          let displayStatus = "Pending";
          let meta: [string, string] = ["", ""];
          let primaryLabel = "View Details";
          let secondaryLabel = "Manage";
          let isAlert = false;

          const dateStr = data.createdAt
            ? new Date(data.createdAt.toMillis()).toLocaleDateString()
            : "Just now";

          if (
            data.status === "pending" ||
            data.status === "review_pending" ||
            (data.status === "completed" && !data.providerReview)
          ) {
            statusTone = "slate";
            iconTone = "amber";
            displayStatus = "Pending";
            meta =
              data.status === "review_pending" || data.status === "completed"
                ? [`Reviewed: ${dateStr}`, "Awaiting provider review"]
                : [`Submitted: ${dateStr}`, "Awaiting provider response"];
          } else if (
            data.status === "working" ||
            data.status === "revision" ||
            data.status === "done"
          ) {
            statusTone = "teal";
            iconTone = "teal";
            displayStatus = "Matched";
            meta = [
              `Started: ${dateStr}`,
              `Matched with: ${data.providerName || "Provider"}`,
            ];
          } else if (data.status === "completed") {
            statusTone = "teal";
            iconTone = "blue";
            displayStatus = "Completed";
            const ratingStr = data.review?.rating
              ? `${data.review.rating}.0/5.0`
              : "No rating";
            meta = [`Completed: ${dateStr}`, `Rated: ${ratingStr}`];
            primaryLabel = "View Review";
            secondaryLabel = "Summary";
          } else if (data.status === "rejected") {
            statusTone = "red";
            iconTone = "red";
            displayStatus = "Declined";
            meta = [`Submitted: ${dateStr}`, "Provider declined."];
            primaryLabel = "Re-request";
            secondaryLabel = "Close";
            isAlert = true;
          }

          docs.push({
            id: docSnap.id,
            title: data.title || "Untitled Request",
            subject: data.category || "General",
            status: displayStatus,
            statusTone,
            iconTone,
            meta,
            primaryLabel,
            secondaryLabel,
            isAlert,
          });
        });
        setRequestState({ uid: userProfile.uid, requests: docs.reverse() }); // latest first
      },
      (err) => {
        console.error("Error fetching requests:", err);
        setRequestState({ uid: userProfile.uid, requests: [] });
      },
    );

    return () => unsubscribe();
  }, [userProfile]);

  const requests =
    userProfile && requestState?.uid === userProfile.uid
      ? requestState.requests
      : [];
  const loading =
    authLoading ||
    Boolean(userProfile && requestState?.uid !== userProfile.uid);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#2b62e6] border-t-transparent" />
      </div>
    );
  }

  const filters: Array<{ label: FilterKey; count: number }> = [
    { label: "All Requests", count: requests.length },
    {
      label: "Pending",
      count: requests.filter((request) => request.status === "Pending").length,
    },
    {
      label: "Matched",
      count: requests.filter((request) => request.status === "Matched").length,
    },
    {
      label: "Completed",
      count: requests.filter((request) => request.status === "Completed")
        .length,
    },
    {
      label: "Declined",
      count: requests.filter((request) => request.status === "Declined").length,
    },
  ];

  const visibleRequests =
    activeFilter === "All Requests"
      ? requests
      : requests.filter((request) => request.status === activeFilter);

  return (
    <div className="flex w-full max-w-[1080px] flex-col gap-8 pb-10">
      <section className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            My Requests
          </h1>
          <p className="mt-2 text-base text-slate-600">
            Manage and track your active learning goals and requests.
          </p>
        </div>

        <Link
          href={scopedHref("/request-service", role)}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#2f66e7] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#2557cf] sm:w-auto"
        >
          <PlusIcon className="h-4 w-4" />
          New Skill Request
        </Link>
      </section>

      <section className="flex flex-wrap gap-3">
        {filters.map((filter) => (
          <button
            key={filter.label}
            type="button"
            onClick={() => setActiveFilter(filter.label)}
            className={`inline-flex h-10 items-center justify-center rounded-full px-5 text-sm font-medium transition ${
              activeFilter === filter.label
                ? "bg-[#62ead8] text-teal-900"
                : "bg-[#e9ebfa] text-slate-700 hover:bg-[#dfe3f7]"
            }`}
          >
            {filter.label} ({filter.count})
          </button>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        {visibleRequests.map((request) => (
          <RequestCard key={request.id} request={request} />
        ))}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_10px_26px_rgba(15,23,42,0.04)]">
        <h2 className="text-xl font-semibold text-slate-900">
          Tips for Better Matches
        </h2>
        <div className="mt-5 grid gap-6 md:grid-cols-3">
          {tips.map((tip) => {
            const Icon = tip.icon;
            return (
              <div key={tip.title} className="flex gap-3">
                <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    {tip.title}
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {tip.body}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function RequestCard({ request }: { request: RequestCardData }) {
  const statusClassName =
    request.statusTone === "teal"
      ? "bg-[#ccfaf1] text-teal-800"
      : request.statusTone === "red"
        ? "bg-red-100 text-red-700"
        : "bg-[#e9ebfa] text-slate-700";

  const iconClassName =
    request.iconTone === "teal"
      ? "bg-teal-50 text-teal-700"
      : request.iconTone === "amber"
        ? "bg-amber-50 text-amber-700"
        : request.iconTone === "blue"
          ? "bg-blue-50 text-[#2f66e7]"
          : "bg-red-50 text-red-600";

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_10px_26px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between gap-4">
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-lg ${iconClassName}`}
        >
          <RequestIcon tone={request.iconTone} />
        </span>
        <span
          className={`rounded-full px-3 py-1 text-sm font-medium ${statusClassName}`}
        >
          {request.status}
        </span>
      </div>

      <h3 className="mt-5 text-xl font-semibold leading-8 text-slate-900">
        {request.title}
      </h3>
      <p className="mt-1 text-sm font-medium text-teal-700">
        {request.subject}
      </p>

      <div className="mt-5 grid gap-3 text-sm text-slate-600">
        <MetaRow
          icon={<CalendarIcon className="h-4 w-4" />}
          text={request.meta[0]}
          tone={request.isAlert ? "default" : "default"}
        />
        <MetaRow
          icon={
            request.isAlert ? (
              <AlertIcon className="h-4 w-4" />
            ) : request.status === "Completed" ? (
              <StarIcon className="h-4 w-4" />
            ) : request.status === "Pending" ? (
              <ClockIcon className="h-4 w-4" />
            ) : (
              <UserIcon className="h-4 w-4" />
            )
          }
          text={request.meta[1]}
          tone={request.isAlert ? "alert" : "default"}
        />
      </div>

      <div className="mt-6 border-t border-slate-200 pt-6">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            className="text-base font-medium text-[#0f4cbf] transition hover:text-[#0c3f9d]"
          >
            {request.primaryLabel}
          </button>
          <button
            type="button"
            className="inline-flex h-10 min-w-20 items-center justify-center rounded-lg bg-[#e3e4f2] px-4 text-sm font-medium text-slate-700 transition hover:bg-[#d5d8ea]"
          >
            {request.secondaryLabel}
          </button>
        </div>
      </div>
    </article>
  );
}

function MetaRow({
  icon,
  text,
  tone,
}: {
  icon: React.ReactNode;
  text: string;
  tone: "default" | "alert";
}) {
  return (
    <div
      className={`flex items-center gap-2 ${tone === "alert" ? "text-red-600" : "text-slate-600"}`}
    >
      <span className="shrink-0">{icon}</span>
      <span>{text}</span>
    </div>
  );
}

function RequestIcon({ tone }: { tone: "teal" | "amber" | "blue" | "red" }) {
  if (tone === "amber") {
    return <BrushIcon className="h-4 w-4" />;
  }

  if (tone === "blue") {
    return <MathIcon className="h-4 w-4" />;
  }

  if (tone === "red") {
    return <GlobeIcon className="h-4 w-4" />;
  }

  return <CodeIcon className="h-4 w-4" />;
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M8 3v4M16 3v4M4 10h16" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M12 12a3.5 3.5 0 1 0-3.5-3.5A3.5 3.5 0 0 0 12 12z" />
      <path d="M5 19c1.3-2.5 3.8-4 7-4s5.7 1.5 7 4" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v5l3 2" />
    </svg>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M12 3l2.6 5.4 5.9.9-4.3 4.1 1 5.9L12 16.8 6.8 19.3l1-5.9L3.5 9.3l5.9-.9z" />
    </svg>
  );
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5" />
      <path d="M12 16h.01" />
    </svg>
  );
}

function DocumentIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M7 3h7l5 5v13H7z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6M9 17h6" />
    </svg>
  );
}

function HandHeartIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M4 14h4l2 4 2-6 2 4h6" />
      <path d="M15.5 6.5a2.5 2.5 0 0 1 4 3c-1.3 1.7-4 3.5-4 3.5s-2.7-1.8-4-3.5a2.5 2.5 0 0 1 4-3z" />
    </svg>
  );
}

function CodeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M9 8l-4 4 4 4" />
      <path d="M15 8l4 4-4 4" />
    </svg>
  );
}

function BrushIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M14 6l4 4" />
      <path d="M5 19c1.8 0 3-.6 3.8-1.8l8.7-8.7a2.8 2.8 0 0 0-4-4l-8.7 8.7C3.6 14 3 15.2 3 17c0 1.1.9 2 2 2z" />
      <path d="M7.5 15.5c.4 1.5-.1 3-1.5 3.5" />
    </svg>
  );
}

function MathIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M7 7h10" />
      <path d="M9 17h6" />
      <path d="M8 12l8-4-8-4" />
      <path d="M8 12l8 4-8 4" />
    </svg>
  );
}

function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a15 15 0 0 1 0 18" />
      <path d="M12 3a15 15 0 0 0 0 18" />
    </svg>
  );
}
