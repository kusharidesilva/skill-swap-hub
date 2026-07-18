"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { SERVICE_CATEGORIES } from "@/lib/platform";

type TimestampLike = { toDate?: () => Date } | Date | string | number | null | undefined;

type UserRecord = {
  role?: string;
  accountStatus?: string;
  providerVerificationStatus?: string;
  createdAt?: TimestampLike;
};

type VerificationRecord = {
  studentName?: string;
  email?: string;
  status?: string;
  submittedAt?: TimestampLike;
};

type GigRecord = {
  title?: string;
  category?: string;
  status?: string;
  createdAt?: TimestampLike;
};

type ReportRecord = {
  reporterName?: string;
  targetUserName?: string;
  reportedUserName?: string;
  type?: string;
  issueType?: string;
  status?: string;
  createdAt?: TimestampLike;
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
  hoverClassName: string;
};

type CategoryRow = {
  label: string;
  value: string;
  accent: string;
  icon: ReactNode;
};

type ActivityRange = "years" | "months" | "weeks";

type ActivityBucket = {
  key: string;
  label: string;
  shortLabel?: string;
  start: Date;
  end: Date;
};

type ActivitySeriesKey = "users" | "providers" | "buyers" | "gigs";

type ActivitySeries = {
  key: ActivitySeriesKey;
  label: string;
  accent: string;
  counts: number[];
  total: number;
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
  const [activityRange, setActivityRange] = useState<ActivityRange>("months");

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
        collection(db, "gigs"),
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
    { label: "Total Users", value: String(users.length), accent: "#1d4ed8", icon: <UsersIcon />, hoverClassName: "hover:border-blue-300 hover:bg-blue-50/40" },
    { label: "Pending Student Verifications", value: String(pendingVerifications.length), accent: "#b45309", icon: <ClipboardIcon />, hoverClassName: "hover:border-amber-300 hover:bg-amber-50/50" },
    { label: "Approved Providers", value: String(approvedProviders.length), accent: "#0f766e", icon: <BadgeCheckIcon />, hoverClassName: "hover:border-teal-300 hover:bg-teal-50/40" },
    { label: "Pending Reports", value: String(pendingReports.length), accent: "#b91c1c", icon: <FlagIcon />, muted: pendingReports.length > 0, hoverClassName: "hover:border-rose-300 hover:bg-rose-50/50" },
  ];

  const secondaryStats: StatCard[] = [
    { label: "Active Buyers", value: String(activeBuyers.length), accent: "#2563eb", icon: <BuyerGroupIcon />, hoverClassName: "hover:border-blue-300 hover:bg-blue-50/40" },
    { label: "Active Providers", value: String(activeProviders.length), accent: "#0f766e", icon: <ShieldIcon />, hoverClassName: "hover:border-teal-300 hover:bg-teal-50/40" },
    { label: "Completed Orders", value: String(completedOrders.length), accent: "#7c3aed", icon: <CompletedOrdersIcon />, hoverClassName: "hover:border-violet-300 hover:bg-violet-50/40" },
    { label: "Active Gigs", value: String(activeGigs.length), accent: "#2563eb", icon: <ActiveGigsIcon />, hoverClassName: "hover:border-blue-300 hover:bg-blue-50/40" },
  ];
  const allStats = [...topStats, ...secondaryStats];
  const activityBuckets = useMemo(
    () => buildActivityBuckets(activityRange, new Date()),
    [activityRange],
  );

  const activitySeries = useMemo<ActivitySeries[]>(() => {
    const providerUsers = users.filter(
      (user) => user.role === "provider" || user.role === "both",
    );
    const buyerUsers = users.filter(
      (user) => user.role === "buyer" || user.role === "both",
    );

    const nextSeries: ActivitySeries[] = [
      {
        key: "users",
        label: "Joined Users",
        accent: "#2563eb",
        counts: countRecordsByBuckets(users, activityBuckets),
        total: 0,
      },
      {
        key: "providers",
        label: "Joined Providers",
        accent: "#0f766e",
        counts: countRecordsByBuckets(providerUsers, activityBuckets),
        total: 0,
      },
      {
        key: "buyers",
        label: "Joined Buyers",
        accent: "#7c3aed",
        counts: countRecordsByBuckets(buyerUsers, activityBuckets),
        total: 0,
      },
      {
        key: "gigs",
        label: "Created Gigs",
        accent: "#d97706",
        counts: countRecordsByBuckets(gigs, activityBuckets),
        total: 0,
      },
    ];

    return nextSeries.map((series) => ({
      ...series,
      total: series.counts.reduce((sum, value) => sum + value, 0),
    }));
  }, [activityBuckets, gigs, users]);

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
            <RangeSelector value={activityRange} onChange={setActivityRange} />
          </div>
          <div className="mt-5 rounded-xl border border-slate-200 bg-[#f3f4ff] p-6">
            <ActivityPanel
              range={activityRange}
              buckets={activityBuckets}
              series={activitySeries}
            />
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
  const date = toDateValue(value);

  if (!date) return "Recently";

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function normalizeStatus(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "_").replace(/-/g, "_");
}

function StatCardBlock({ stat, loading }: { stat: StatCard; loading: boolean }) {
  return (
    <article
      className={`rounded-2xl border bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:scale-[1.01] hover:shadow-md ${
        stat.hoverClassName
      } ${
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

function ActivityPanel({
  range,
  buckets,
  series,
}: {
  range: ActivityRange;
  buckets: ActivityBucket[];
  series: ActivitySeries[];
}) {
  const maxValue = Math.max(
    1,
    ...series.flatMap((item) => item.counts),
  );
  const yAxisSteps = buildYAxisSteps(maxValue);

  return (
    <div className="rounded-xl border border-slate-200 bg-[#f3f4ff] p-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              {range === "years"
                ? "Yearly growth"
                : range === "months"
                  ? "Monthly growth"
                  : "Weekly growth"}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Users, providers, buyers, and gigs created in the selected period.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-slate-500">
            {series.map((item) => (
              <div key={item.key} className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: item.accent }}
                />
                <span>{item.label}</span>
                <span className="text-slate-700">{item.total}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 grid min-h-[320px] grid-cols-[40px_minmax(0,1fr)] gap-4">
          <div className="flex flex-col justify-between pb-8 text-[11px] font-semibold text-slate-400">
            {yAxisSteps.map((value, index) => (
              <span key={`${value}-${index}`}>{value}</span>
            ))}
          </div>

          <div className="relative">
            <div className="pointer-events-none absolute inset-0 flex flex-col justify-between pb-8">
              {yAxisSteps.map((value, index) => (
                <div key={`${value}-${index}`} className="border-t border-dashed border-slate-200" />
              ))}
            </div>

            <div
              className="relative grid h-full gap-3"
              style={{ gridTemplateColumns: `repeat(${buckets.length}, minmax(0, 1fr))` }}
            >
              {buckets.map((bucket, bucketIndex) => (
                <div key={bucket.key} className="flex min-w-0 flex-col justify-end">
                  <div className="flex h-[270px] items-end justify-center gap-1.5 rounded-xl px-1 pb-2">
                    {series.map((item) => {
                      const value = item.counts[bucketIndex] || 0;
                      const height = `${Math.max((value / maxValue) * 100, value > 0 ? 8 : 0)}%`;

                      return (
                        <div
                          key={`${item.key}-${bucket.key}`}
                          className="flex flex-1 items-end"
                        >
                          <div
                            className="w-full rounded-t-md transition-opacity hover:opacity-90"
                            style={{
                              height,
                              backgroundColor: item.accent,
                            }}
                            title={`${item.label}: ${value}`}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div className="pt-3 text-center">
                    <p className="text-xs font-semibold text-slate-600">{bucket.label}</p>
                    {bucket.shortLabel ? (
                      <p className="mt-0.5 text-[11px] text-slate-400">{bucket.shortLabel}</p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RangeSelector({
  value,
  onChange,
}: {
  value: ActivityRange;
  onChange: (value: ActivityRange) => void;
}) {
  const options: Array<{ value: ActivityRange; label: string }> = [
    { value: "years", label: "Years" },
    { value: "months", label: "Months" },
    { value: "weeks", label: "Weeks" },
  ];

  return (
    <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 p-1">
      {options.map((option) => {
        const active = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              active
                ? "bg-[#1d4ed8] text-white shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {option.label}
          </button>
        );
      })}
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

function buildActivityBuckets(range: ActivityRange, now: Date) {
  if (range === "weeks") {
    const buckets: ActivityBucket[] = [];
    const today = startOfDay(now);

    for (let index = 6; index >= 0; index -= 1) {
      const start = addDays(today, -index);
      const end = addDays(start, 1);
      buckets.push({
        key: start.toISOString(),
        label: start.toLocaleDateString("en-US", { weekday: "short" }),
        shortLabel: start.toLocaleDateString("en-US", { day: "numeric", month: "short" }),
        start,
        end,
      });
    }

    return buckets;
  }

  if (range === "months") {
    const buckets: ActivityBucket[] = [];

    for (let index = 5; index >= 0; index -= 1) {
      const start = new Date(now.getFullYear(), now.getMonth() - index, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - index + 1, 1);
      buckets.push({
        key: `${start.getFullYear()}-${start.getMonth()}`,
        label: start.toLocaleDateString("en-US", { month: "short" }),
        shortLabel: String(start.getFullYear()),
        start,
        end,
      });
    }

    return buckets;
  }

  return Array.from({ length: 5 }, (_, arrayIndex) => {
    const year = now.getFullYear() - (4 - arrayIndex);
    const start = new Date(year, 0, 1);
    const end = new Date(year + 1, 0, 1);

    return {
      key: String(year),
      label: String(year),
      start,
      end,
    };
  });
}

function countRecordsByBuckets(
  records: Array<{ createdAt?: TimestampLike }>,
  buckets: ActivityBucket[],
) {
  return buckets.map((bucket) =>
    records.reduce((count, record) => {
      const recordDate = toDateValue(record.createdAt);

      if (!recordDate) return count;
      if (recordDate >= bucket.start && recordDate < bucket.end) {
        return count + 1;
      }

      return count;
    }, 0),
  );
}

function toDateValue(value: TimestampLike) {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "object") {
    if ("toDate" in value && typeof value.toDate === "function") {
      const nextDate = value.toDate();
      return Number.isNaN(nextDate.getTime()) ? null : nextDate;
    }

    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function addDays(value: Date, days: number) {
  const date = new Date(value);
  date.setDate(date.getDate() + days);
  return date;
}

function buildYAxisSteps(maxValue: number) {
  return [maxValue, Math.ceil(maxValue * 0.66), Math.ceil(maxValue * 0.33), 0];
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

function BuyerGroupIcon() {
  return <Icon path="M16 21v-2.2a3.8 3.8 0 0 0-3.8-3.8H7.8A3.8 3.8 0 0 0 4 18.8V21 M10 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7 M17.5 11.5 19 13l3-3.2" />;
}

function CompletedOrdersIcon() {
  return <Icon path="M8 7h10l1.4 2.4v7.6A2 2 0 0 1 17.4 19H8a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z M10 7V5.8A1.8 1.8 0 0 1 11.8 4h2.4A1.8 1.8 0 0 1 16 5.8V7 M9.5 12.2l2 2 3.7-3.9" />;
}

function ActiveGigsIcon() {
  return <Icon path="M7 6.5h3l1.2-1.8h1.6L14 6.5h3A2.2 2.2 0 0 1 19.2 8.7v7.6A2.2 2.2 0 0 1 17 18.5H7A2.2 2.2 0 0 1 4.8 16.3V8.7A2.2 2.2 0 0 1 7 6.5Z M9 11.7h6 M9 14.7h3.8" />;
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
