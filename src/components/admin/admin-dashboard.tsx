"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { SERVICE_CATEGORIES } from "@/lib/platform";

type UserRecord = {
  role?: string;
  accountStatus?: string;
  providerVerificationStatus?: string;
};

type VerificationRecord = {
  studentName?: string;
  email?: string;
  status?: string;
  submittedAt?: { toDate?: () => Date } | Date | string | number | null;
};

type GigRecord = {
  title?: string;
  category?: string;
  status?: string;
};

type ReportRecord = {
  reporterName?: string;
  targetUserName?: string;
  reportedUserName?: string;
  type?: string;
  issueType?: string;
  status?: string;
  createdAt?: { toDate?: () => Date } | Date | string | number | null;
};

type OrderRecord = {
  orderStatus?: string;
  status?: string;
};

type ActionRow = {
  id: string;
  type: string;
  entity: string;
  date: string;
  status: string;
  action: string;
  icon: ReactNode;
  statusTone: "critical" | "pending";
};

type StatCard = {
  label: string;
  value: string;
  accent: string;
  icon: ReactNode;
  muted?: boolean;
};

type CategoryRow = {
  label: string;
  value: string;
  accent: string;
  icon: ReactNode;
};

export default function AdminDashboard() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [verifications, setVerifications] = useState<Array<VerificationRecord & { id: string }>>([]);
  const [gigs, setGigs] = useState<GigRecord[]>([]);
  const [reports, setReports] = useState<Array<ReportRecord & { id: string }>>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [warnings, setWarnings] = useState<string[]>([]);

  useEffect(() => {
    const requiredSources = new Set(["users", "providerVerifications"]);
    const loadedSources = new Set<string>();

    function markLoaded(source: string) {
      loadedSources.add(source);
      if ([...requiredSources].every((item) => loadedSources.has(item))) {
        setLoading(false);
      }
    }

    function handleSnapshotError(source: string, error: Error) {
      console.error(`Error loading admin dashboard ${source}:`, error);

      if (requiredSources.has(source)) {
        setLoadError(
          "Firestore blocked part of the admin dashboard. Check that the signed-in account has the admin profile and that the latest firestore.rules are deployed.",
        );
      } else {
        setWarnings((current) =>
          current.includes(source)
            ? current
            : [...current, source],
        );
      }

      markLoaded(source);
    }

    const unsubscribers = [
      onSnapshot(
        collection(db, "users"),
        (snapshot) => {
          setUsers(snapshot.docs.map((docSnap) => docSnap.data() as UserRecord));
          setLoadError("");
          markLoaded("users");
        },
        (error) => handleSnapshotError("users", error),
      ),
      onSnapshot(
        collection(db, "providerVerifications"),
        (snapshot) => {
          setVerifications(
            snapshot.docs.map((docSnap) => ({
              id: docSnap.id,
              ...(docSnap.data() as VerificationRecord),
            })),
          );
          markLoaded("providerVerifications");
        },
        (error) => handleSnapshotError("providerVerifications", error),
      ),
      onSnapshot(
        query(collection(db, "gigs"), where("status", "==", "active")),
        (snapshot) => {
          setGigs(snapshot.docs.map((docSnap) => docSnap.data() as GigRecord));
          markLoaded("gigs");
        },
        (error) => handleSnapshotError("gigs", error),
      ),
      onSnapshot(
        collection(db, "reports"),
        (snapshot) => {
          setReports(
            snapshot.docs.map((docSnap) => ({
              id: docSnap.id,
              ...(docSnap.data() as ReportRecord),
            })),
          );
          markLoaded("reports");
        },
        (error) => handleSnapshotError("reports", error),
      ),
      onSnapshot(
        collection(db, "serviceOrders"),
        (snapshot) => {
          setOrders(snapshot.docs.map((docSnap) => docSnap.data() as OrderRecord));
          markLoaded("serviceOrders");
        },
        (error) => handleSnapshotError("serviceOrders", error),
      ),
    ];

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, []);

  const pendingVerifications = verifications.filter((item) => item.status === "pending");
  const approvedProviders = users.filter(
    (user) => user.role === "provider" || user.role === "both",
  );
  const activeBuyers = users.filter(
    (user) =>
      normalizeStatus(user.accountStatus || "active") === "active" &&
      (user.role === "buyer" || user.role === "both"),
  );
  const activeProviders = users.filter(
    (user) =>
      normalizeStatus(user.accountStatus || "active") === "active" &&
      (user.role === "provider" || user.role === "both"),
  );
  const activeGigs = gigs.filter((gig) => (gig.status || "active") === "active");
  const completedOrders = orders.filter(
    (order) => normalizeStatus(order.orderStatus || order.status || "") === "completed",
  );
  const pendingReports = reports.filter(
    (report) => normalizeStatus(report.status || "pending") === "pending",
  );

  const topStats: StatCard[] = [
    { label: "Total Users", value: String(users.length), accent: "#1d4ed8", icon: <UsersIcon /> },
    { label: "Pending Student Verifications", value: String(pendingVerifications.length), accent: "#b45309", icon: <ClipboardIcon /> },
    { label: "Approved Providers", value: String(approvedProviders.length), accent: "#0f766e", icon: <BadgeCheckIcon /> },
    { label: "Pending Reports", value: String(pendingReports.length), accent: "#b91c1c", icon: <FlagIcon />, muted: pendingReports.length > 0 },
  ];

  const secondaryStats: StatCard[] = [
    { label: "Active Buyers", value: String(activeBuyers.length), accent: "#2563eb", icon: <UsersIcon /> },
    { label: "Active Providers", value: String(activeProviders.length), accent: "#0f766e", icon: <ShieldIcon /> },
    { label: "Completed Orders", value: String(completedOrders.length), accent: "#7c3aed", icon: <OfferIcon /> },
    { label: "Active Gigs", value: String(activeGigs.length), accent: "#2563eb", icon: <OfferIcon /> },
  ];
  const allStats = [...topStats, ...secondaryStats];

  const topCategories = useMemo<CategoryRow[]>(() => {
    const counts = new Map<string, number>();
    activeGigs.forEach((gig) => {
      const category = gig.category && SERVICE_CATEGORIES.includes(gig.category as never)
        ? gig.category
        : "Other";
      counts.set(category, (counts.get(category) || 0) + 1);
    });

    const total = Math.max(activeGigs.length, 1);
    return [...SERVICE_CATEGORIES]
      .map((category, index) => ({
        label: category,
        value: `${Math.round(((counts.get(category) || 0) / total) * 100)}%`,
        accent: ["#1d4ed8", "#0f766e", "#c2410c", "#6b7280"][index % 4],
        icon: <CategoryIcon />,
      }))
      .filter((category) => category.value !== "0%")
      .slice(0, 4);
  }, [activeGigs]);

  const actions: ActionRow[] = [
    ...pendingVerifications.slice(0, 2).map((item) => ({
      id: `verification-${item.id}`,
      type: "Student Verification",
      entity: item.studentName || item.email || "Pending student",
      date: formatDate(item.submittedAt),
      status: "Pending",
      action: "Review",
      icon: <ShieldIcon />,
      statusTone: "pending" as const,
    })),
    ...pendingReports.slice(0, 3).map((item) => ({
      id: `report-${item.id}`,
      type: "User Report",
      entity: item.targetUserName || item.reportedUserName || item.issueType || item.type || "Reported user",
      date: formatDate(item.createdAt),
      status: "Critical",
      action: "Review",
      icon: <FlagIcon />,
      statusTone: "critical" as const,
    })),
  ].slice(0, 4);

  return (
    <div className="mx-auto w-full max-w-[1480px] px-6 py-10">
      {loadError ? (
        <section className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
          {loadError}
        </section>
      ) : null}

      {warnings.length ? (
        <section className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-medium text-amber-800">
          Some optional dashboard panels are limited right now: {warnings.join(", ")}.
        </section>
      ) : null}

      <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {allStats.map((stat) => (
          <StatCardBlock key={stat.label} stat={stat} loading={loading} />
        ))}
      </section>

      <section className="mt-10 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-3">
            <h3 className="text-xl font-semibold text-slate-900">Platform Activity</h3>
            <span className="text-sm font-semibold text-[#1d4ed8]">Live</span>
          </div>
          <div className="mt-5 rounded-xl border border-slate-200 bg-[#f3f4ff] p-6">
            <ActivityPanel users={users.length} gigs={activeGigs.length} reports={pendingReports.length} />
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-xl font-semibold text-slate-900">Top Categories</h3>
          <div className="mt-3 border-t border-slate-200 pt-4">
            <div className="space-y-5">
              {topCategories.length ? (
                topCategories.map((category) => <CategoryItem key={category.label} category={category} />)
              ) : (
                <p className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                  No active service gigs yet.
                </p>
              )}
            </div>
          </div>
        </article>
      </section>

      <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-3">
          <h3 className="text-xl font-semibold text-slate-900">Action Required</h3>
          <span className="text-sm font-semibold text-[#1d4ed8]">{actions.length} Open</span>
        </div>

        <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200">
          <div className="min-w-[760px]">
            <div className="grid grid-cols-[1.1fr_1.6fr_1fr_0.8fr_0.8fr] border-b border-slate-200 bg-slate-50 px-6 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
              <span>Type</span>
              <span>User/Entity</span>
              <span>Date Submitted</span>
              <span>Status</span>
              <span>Action</span>
            </div>

            {actions.length ? (
              actions.map((row) => (
                <div
                  key={row.id}
                  className="grid grid-cols-[1.1fr_1.6fr_1fr_0.8fr_0.8fr] items-center border-b border-slate-200 px-6 py-4 text-sm last:border-b-0"
                >
                  <div className="flex items-center gap-2 text-slate-700">
                    <span className="text-[#d04b00]">{row.icon}</span>
                    <span>{row.type}</span>
                  </div>
                  <span className="font-medium text-slate-800">{row.entity}</span>
                  <span className="text-slate-600">{row.date}</span>
                  <span
                    className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${
                      row.statusTone === "critical" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {row.status}
                  </span>
                  <span className="font-semibold text-[#1d4ed8]">{row.action}</span>
                </div>
              ))
            ) : (
              <div className="px-6 py-10 text-center text-sm text-slate-500">
                No pending verification or report actions.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function formatDate(value: VerificationRecord["submittedAt"] | ReportRecord["createdAt"]) {
  if (!value) return "Recently";
  const date =
    typeof value === "object" && "toDate" in value && typeof value.toDate === "function"
      ? value.toDate()
      : new Date(value as Date | string | number);

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function normalizeStatus(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "_").replace(/-/g, "_");
}

function StatCardBlock({ stat, loading }: { stat: StatCard; loading: boolean }) {
  return (
    <article
      className={`rounded-2xl border bg-white p-5 shadow-sm ${
        stat.muted ? "border-red-200 bg-[#ffe3df]" : "border-slate-200"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <p className={`text-sm font-medium ${stat.muted ? "text-red-700" : "text-slate-600"}`}>
          {stat.label}
        </p>
        <span
          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 shadow-sm"
          style={{ color: stat.accent }}
        >
          {stat.icon}
        </span>
      </div>
      <p className={`mt-5 text-3xl font-semibold ${stat.muted ? "text-red-800" : "text-slate-900"}`}>
        {loading ? "..." : stat.value}
      </p>
    </article>
  );
}

function ActivityPanel({ users, gigs, reports }: { users: number; gigs: number; reports: number }) {
  return (
    <div className="grid min-h-[290px] place-items-center rounded-xl border border-slate-200 bg-[#f3f4ff]">
      <div className="grid w-full max-w-md gap-4 text-sm">
        <ActivityRow label="Users" value={users} accent="#1d4ed8" />
        <ActivityRow label="Active service gigs" value={gigs} accent="#0f766e" />
        <ActivityRow label="Pending reports" value={reports} accent="#b91c1c" />
      </div>
    </div>
  );
}

function ActivityRow({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="rounded-xl bg-white px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="font-medium text-slate-600">{label}</span>
        <span className="text-lg font-semibold text-slate-900">{value}</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-slate-200">
        <div className="h-2 rounded-full" style={{ width: `${Math.min(value * 10, 100)}%`, backgroundColor: accent }} />
      </div>
    </div>
  );
}

function CategoryItem({ category }: { category: CategoryRow }) {
  return (
    <div className="grid gap-2">
      <div className="flex items-center gap-3">
        <span
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 shadow-sm"
          style={{ color: category.accent }}
        >
          {category.icon}
        </span>
        <div className="flex-1 text-sm font-medium text-slate-800">{category.label}</div>
        <span className="text-sm text-slate-500">{category.value}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-200">
        <div className="h-2 rounded-full" style={{ width: category.value, backgroundColor: category.accent }} />
      </div>
    </div>
  );
}

function UsersIcon() {
  return <Icon path="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75" />;
}

function BadgeCheckIcon() {
  return <Icon path="M12 2.8 6.8 5.1v4.7c0 4 2.3 6.8 5.2 8.4 2.9-1.6 5.2-4.4 5.2-8.4V5.1L12 2.8Z m-2.3 8.1 1.6 1.7 3.2-3.4" />;
}

function ClipboardIcon() {
  return <Icon path="M6 4.75h12v15.5H6z M9 4.75h6 M9 10.5h6 M9 14h6 M9 17.5h3.5" />;
}

function FlagIcon() {
  return <Icon path="M5.5 4v16 M5.5 5h9l-1.8 3 1.8 3h-9" />;
}

function ShieldIcon() {
  return <Icon path="M12 3 5.5 5.9v5.7c0 4.4 2.8 7.2 6.5 8.9 3.7-1.7 6.5-4.5 6.5-8.9V5.9L12 3Z m-2.6 8.9 1.8 1.8 3.6-3.8" />;
}

function OfferIcon() {
  return <Icon path="M5.5 7.5h9.8a2 2 0 0 1 1.4.6l1.8 1.8a2 2 0 0 1 0 2.8l-5.7 5.7a2 2 0 0 1-2.8 0l-4.5-4.5a2 2 0 0 1 0-2.8l2.8-2.8a2 2 0 0 1 1.2-.6Z M14.5 7.5v4h4" />;
}

function CategoryIcon() {
  return <Icon path="M4 7h16 M4 12h16 M4 17h16" />;
}

function Icon({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      {path.split(" M").map((segment, index) => (
        <path key={index} d={index === 0 ? segment : `M${segment}`} />
      ))}
    </svg>
  );
}
