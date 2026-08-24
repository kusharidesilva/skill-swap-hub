"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { isPendingAdminReport, normalizeAdminRole } from "@/lib/admin-panel";
import { useLookupOptions } from "@/lib/lookups";

type TimestampLike =
  | {
      toDate?: () => Date;
      seconds?: number;
      nanoseconds?: number;
      _seconds?: number;
      _nanoseconds?: number;
    }
  | Date
  | string
  | number
  | null
  | undefined;

type UserRecord = {
  role?: string;
  accountStatus?: string;
  providerVerificationStatus?: string;
  createdAt?: TimestampLike;
  providerApprovedAt?: TimestampLike;
  updatedAt?: TimestampLike;
  providerProfile?: {
    gigs?: GigRecord[];
  };
};

type VerificationRecord = {
  studentName?: string;
  email?: string;
  status?: string;
  submittedAt?: TimestampLike;
};

type GigRecord = {
  id?: string;
  gigId?: string;
  title?: string;
  category?: string;
  status?: string;
  gigStatus?: string;
  createdAt?: TimestampLike;
  updatedAt?: TimestampLike;
};

type ReportRecord = {
  reporterName?: string;
  targetUserName?: string;
  reportedUserName?: string;
  type?: string;
  issueType?: string;
  status?: string;
  adminNeedsReview?: boolean;
  createdAt?: TimestampLike;
};

type OrderRecord = {
  id?: string;
  sourceCollection?: "requests" | "directServiceRequests" | "serviceOrders";
  directRequestId?: string;
  orderId?: string;
  orderStatus?: string;
  requestStatus?: string;
  status?: string;
  review?: Record<string, unknown>;
  providerReview?: Record<string, unknown>;
};

type ActionRow = {
  id: string;
  type: string;
  entity: string;
  date: string;
  status: string;
  action: string;
  href: string;
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
  counts: Array<number | null>;
  periodCounts: number[];
  total: number;
};

type ActivityChartPoint = {
  x: number;
  y: number;
  index: number;
  value: number;
};

const ACTIVITY_CHART_WIDTH = 1000;
const ACTIVITY_CHART_HEIGHT = 270;
const ACTIVITY_SERIES_DASHES = [undefined, "12 7", "3 7", "16 6 3 6"];
const MONTHLY_ACTIVITY_START = new Date(2026, 6, 1);
const YEARLY_ACTIVITY_START_YEAR = 2025;

export default function AdminDashboard() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [verifications, setVerifications] = useState<
    Array<VerificationRecord & { id: string }>
  >([]);
  const [gigs, setGigs] = useState<GigRecord[]>([]);
  const [reports, setReports] = useState<Array<ReportRecord & { id: string }>>(
    [],
  );
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [directOrders, setDirectOrders] = useState<OrderRecord[]>([]);
  const [serviceOrders, setServiceOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [warnings, setWarnings] = useState<string[]>([]);
  const [activityRange, setActivityRange] = useState<ActivityRange>("months");
  const [activityNow, setActivityNow] = useState(() => new Date());
  const serviceCategories = useLookupOptions("serviceCategories");

  useEffect(() => {
    const requiredSources = new Set(["users", "providerVerifications"]);
    const loadedSources = new Set<string>();

    function markLoaded(source: string) {
      setActivityNow(new Date());
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
          current.includes(source) ? current : [...current, source],
        );
      }

      markLoaded(source);
    }

    const unsubscribers = [
      onSnapshot(
        collection(db, "users"),
        (snapshot) => {
          setUsers(
            snapshot.docs.map((docSnap) => docSnap.data() as UserRecord),
          );
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
          setGigs(
            snapshot.docs.map((docSnap) => ({
              id: docSnap.id,
              ...(docSnap.data() as GigRecord),
            })),
          );
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
        collection(db, "requests"),
        (snapshot) => {
          setOrders(
            snapshot.docs.map((docSnap) => ({
              id: docSnap.id,
              sourceCollection: "requests",
              ...(docSnap.data() as OrderRecord),
            })),
          );
          markLoaded("requests");
        },
        (error) => handleSnapshotError("requests", error),
      ),
      onSnapshot(
        collection(db, "directServiceRequests"),
        (snapshot) => {
          setDirectOrders(
            snapshot.docs.map((docSnap) => ({
              id: docSnap.id,
              sourceCollection: "directServiceRequests",
              ...(docSnap.data() as OrderRecord),
            })),
          );
          markLoaded("directServiceRequests");
        },
        (error) => handleSnapshotError("directServiceRequests", error),
      ),
      onSnapshot(
        collection(db, "serviceOrders"),
        (snapshot) => {
          setServiceOrders(
            snapshot.docs.map((docSnap) => ({
              id: docSnap.id,
              sourceCollection: "serviceOrders",
              ...(docSnap.data() as OrderRecord),
            })),
          );
          markLoaded("serviceOrders");
        },
        (error) => handleSnapshotError("serviceOrders", error),
      ),
    ];

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActivityNow(new Date());
    }, 60000);

    return () => window.clearInterval(interval);
  }, []);

  const pendingVerifications = verifications.filter(
    (item) => normalizeStatus(item.status || "pending") === "pending",
  );
  const approvedProviders = users.filter(
    (user) =>
      normalizeStatus(user.accountStatus || "active") === "active" &&
      normalizeStatus(user.providerVerificationStatus || "") === "approved",
  );
  const activeBuyers = users.filter(
    (user) =>
      normalizeStatus(user.accountStatus || "active") === "active" &&
      ["buyer", "both"].includes(normalizeAdminRole(user.role)),
  );
  const activeProviders = users.filter(
    (user) =>
      normalizeStatus(user.accountStatus || "active") === "active" &&
      normalizeStatus(user.providerVerificationStatus || "") === "approved" &&
      ["provider", "both"].includes(normalizeAdminRole(user.role)),
  );
  const dashboardGigs = useMemo(
    () => mergeDashboardGigs(gigs, users),
    [gigs, users],
  );
  const activeGigs = dashboardGigs.filter(
    (gig) =>
      normalizeStatus(gig.status || gig.gigStatus || "active") === "active",
  );
  const completedOrders = countCompletedOrders([
    ...orders,
    ...directOrders,
    ...serviceOrders,
  ]);
  const pendingReports = reports.filter((report) =>
    isPendingAdminReport(report),
  );

  const topStats: StatCard[] = [
    {
      label: "Total Users",
      value: String(users.length),
      accent: "#1d4ed8",
      icon: <UsersIcon />,
      hoverClassName: "hover:border-blue-300 hover:bg-blue-50/40",
    },
    {
      label: "Pending Student Verifications",
      value: String(pendingVerifications.length),
      accent: "#b45309",
      icon: <ClipboardIcon />,
      hoverClassName: "hover:border-amber-300 hover:bg-amber-50/50",
    },
    {
      label: "Approved Providers",
      value: String(approvedProviders.length),
      accent: "#0f766e",
      icon: <BadgeCheckIcon />,
      hoverClassName: "hover:border-teal-300 hover:bg-teal-50/40",
    },
    {
      label: "Pending Reports",
      value: String(pendingReports.length),
      accent: "#b91c1c",
      icon: <FlagIcon />,
      muted: pendingReports.length > 0,
      hoverClassName: "hover:border-rose-300 hover:bg-rose-50/50",
    },
  ];

  const secondaryStats: StatCard[] = [
    {
      label: "Active Buyers",
      value: String(activeBuyers.length),
      accent: "#2563eb",
      icon: <BuyerGroupIcon />,
      hoverClassName: "hover:border-blue-300 hover:bg-blue-50/40",
    },
    {
      label: "Active Providers",
      value: String(activeProviders.length),
      accent: "#0f766e",
      icon: <ShieldIcon />,
      hoverClassName: "hover:border-teal-300 hover:bg-teal-50/40",
    },
    {
      label: "Completed Orders",
      value: String(completedOrders),
      accent: "#7c3aed",
      icon: <CompletedOrdersIcon />,
      hoverClassName: "hover:border-violet-300 hover:bg-violet-50/40",
    },
    {
      label: "Active Gigs",
      value: String(activeGigs.length),
      accent: "#2563eb",
      icon: <ActiveGigsIcon />,
      hoverClassName: "hover:border-blue-300 hover:bg-blue-50/40",
    },
  ];
  const allStats = [...topStats, ...secondaryStats];
  const activityBuckets = useMemo(
    () => buildActivityBuckets(activityRange, activityNow),
    [activityRange, activityNow],
  );

  const activitySeries = useMemo<ActivitySeries[]>(() => {
    const providerUsers = users.filter(
      (user) =>
        normalizeStatus(user.accountStatus || "active") === "active" &&
        normalizeStatus(user.providerVerificationStatus || "") === "approved" &&
        ["provider", "both"].includes(normalizeAdminRole(user.role)),
    );
    const buyerUsers = users.filter((user) =>
      ["buyer", "both"].includes(normalizeAdminRole(user.role)),
    );

    return [
      buildActivitySeries(
        "users",
        "Joined Users",
        "#2563eb",
        users,
        activityBuckets,
        activityNow,
        ["createdAt", "updatedAt"],
      ),
      buildActivitySeries(
        "providers",
        "Joined Providers",
        "#0f766e",
        providerUsers,
        activityBuckets,
        activityNow,
        ["providerApprovedAt", "createdAt", "updatedAt"],
      ),
      buildActivitySeries(
        "buyers",
        "Joined Buyers",
        "#7c3aed",
        buyerUsers,
        activityBuckets,
        activityNow,
        ["createdAt", "updatedAt"],
      ),
      buildActivitySeries(
        "gigs",
        "Created Gigs",
        "#d97706",
        dashboardGigs,
        activityBuckets,
        activityNow,
        ["createdAt", "updatedAt"],
      ),
    ];
  }, [activityBuckets, activityNow, dashboardGigs, users]);

  const topCategories = useMemo<CategoryRow[]>(() => {
    const managedCategories = new Map(
      serviceCategories.map((category) => [
        category.trim().toLowerCase(),
        category,
      ]),
    );
    const counts = new Map<string, number>();

    activeGigs.forEach((gig) => {
      const category = gig.category
        ? managedCategories.get(gig.category.trim().toLowerCase())
        : undefined;
      if (!category) return;
      counts.set(category, (counts.get(category) || 0) + 1);
    });

    const total = Math.max(
      [...counts.values()].reduce((sum, count) => sum + count, 0),
      1,
    );

    return serviceCategories
      .map((category, index) => ({
        label: category,
        value: `${Math.round(((counts.get(category) || 0) / total) * 100)}%`,
        accent: ["#1d4ed8", "#0f766e", "#c2410c", "#6b7280"][index % 4],
        icon: <CategoryIcon />,
      }))
      .filter((category) => category.value !== "0%")
      .slice(0, 4);
  }, [activeGigs, serviceCategories]);

  const actions: ActionRow[] = [
    ...pendingVerifications.slice(0, 2).map((item) => ({
      id: `verification-${item.id}`,
      type: "Student Verification",
      entity: item.studentName || item.email || "Pending student",
      date: formatDate(item.submittedAt),
      status: "Pending",
      action: "Review",
      href: "/admin/verifications",
      icon: <ShieldIcon />,
      statusTone: "pending" as const,
    })),
    ...pendingReports.slice(0, 3).map((item) => ({
      id: `report-${item.id}`,
      type: "User Report",
      entity:
        item.targetUserName ||
        item.reportedUserName ||
        item.issueType ||
        item.type ||
        "Reported user",
      date: formatDate(item.createdAt),
      status: "Critical",
      action: "Review",
      href: "/admin/issue-resolution",
      icon: <FlagIcon />,
      statusTone: "critical" as const,
    })),
  ]
    .sort((left, right) => {
      const leftDate =
        left.type === "Student Verification"
          ? pendingVerifications.find(
              (item) => `verification-${item.id}` === left.id,
            )?.submittedAt
          : pendingReports.find((item) => `report-${item.id}` === left.id)
              ?.createdAt;
      const rightDate =
        right.type === "Student Verification"
          ? pendingVerifications.find(
              (item) => `verification-${item.id}` === right.id,
            )?.submittedAt
          : pendingReports.find((item) => `report-${item.id}` === right.id)
              ?.createdAt;

      return toMillis(rightDate) - toMillis(leftDate);
    })
    .slice(0, 4);

  return (
    <div className="mx-auto w-full max-w-[1480px] px-6 py-10">
      {loadError ? (
        <section className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
          {loadError}
        </section>
      ) : null}

      {warnings.length ? (
        <section className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-medium text-amber-800">
          Some optional dashboard panels are limited right now:{" "}
          {warnings.join(", ")}.
        </section>
      ) : null}

      <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {allStats.map((stat) => (
          <StatCardBlock key={stat.label} stat={stat} loading={loading} />
        ))}
      </section>

      <section className="mt-10 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">
                Platform Activity
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                A live view of users, providers, buyers, and gigs.
              </p>
            </div>
            <RangeSelector value={activityRange} onChange={setActivityRange} />
          </div>
          <ActivityPanel
            range={activityRange}
            buckets={activityBuckets}
            series={activitySeries}
            updatedAt={activityNow}
          />
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-xl font-semibold text-slate-900">
            Top Categories
          </h3>
          <div className="mt-3 border-t border-slate-200 pt-4">
            <div className="space-y-5">
              {topCategories.length ? (
                topCategories.map((category) => (
                  <CategoryItem key={category.label} category={category} />
                ))
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
          <h3 className="text-xl font-semibold text-slate-900">
            Action Required
          </h3>
          <span className="text-sm font-semibold text-[#1d4ed8]">
            {actions.length} Open
          </span>
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
                  <span className="font-medium text-slate-800">
                    {row.entity}
                  </span>
                  <span className="text-slate-600">{row.date}</span>
                  <span
                    className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${
                      row.statusTone === "critical"
                        ? "bg-red-100 text-red-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {row.status}
                  </span>
                  <a
                    href={row.href}
                    className="font-semibold text-[#1d4ed8] transition hover:text-[#123fa3]"
                  >
                    {row.action}
                  </a>
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

function formatDate(
  value: VerificationRecord["submittedAt"] | ReportRecord["createdAt"],
) {
  if (!value) return "Recently";
  const date = toDateValue(value);

  if (!date) return "Recently";

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function normalizeStatus(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "_").replace(/-/g, "_");
}

function isCompletedOrder(order: OrderRecord) {
  if (order.sourceCollection === "serviceOrders") {
    return normalizeStatus(order.orderStatus || order.status || "") === "completed";
  }

  if (order.sourceCollection === "directServiceRequests") {
    return normalizeStatus(order.requestStatus || order.status || "") === "completed";
  }

  return normalizeStatus(order.status || "") === "completed";
}

function getOrderCountKey(order: OrderRecord) {
  if (order.sourceCollection === "serviceOrders" && order.directRequestId) {
    return `direct:${order.directRequestId}`;
  }

  if (order.sourceCollection === "directServiceRequests") {
    return `direct:${order.id || order.directRequestId || "unknown"}`;
  }

  if (order.sourceCollection === "serviceOrders") {
    return `service:${order.orderId || order.id || "unknown"}`;
  }

  return `request:${order.id || "unknown"}`;
}

function countCompletedOrders(orderRecords: OrderRecord[]) {
  const completedKeys = new Set<string>();

  orderRecords.forEach((order) => {
    if (!isCompletedOrder(order)) return;
    completedKeys.add(getOrderCountKey(order));
  });

  return completedKeys.size;
}

function StatCardBlock({
  stat,
  loading,
}: {
  stat: StatCard;
  loading: boolean;
}) {
  return (
    <article
      className={`rounded-2xl border bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:scale-[1.01] hover:shadow-md ${
        stat.hoverClassName
      } ${stat.muted ? "border-red-200 bg-[#ffe3df]" : "border-slate-200"}`}
    >
      <div className="flex items-start justify-between gap-4">
        <p
          className={`text-sm font-medium ${stat.muted ? "text-red-700" : "text-slate-600"}`}
        >
          {stat.label}
        </p>
        <span
          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 shadow-sm"
          style={{ color: stat.accent }}
        >
          {stat.icon}
        </span>
      </div>
      <p
        className={`mt-5 text-3xl font-semibold ${stat.muted ? "text-red-800" : "text-slate-900"}`}
      >
        {loading ? "..." : stat.value}
      </p>
    </article>
  );
}

function ActivityPanel({
  range,
  buckets,
  series,
  updatedAt,
}: {
  range: ActivityRange;
  buckets: ActivityBucket[];
  series: ActivitySeries[];
  updatedAt: Date;
}) {
  const [activeBucket, setActiveBucket] = useState<{
    range: ActivityRange;
    index: number;
  } | null>(null);
  const activeBucketIndex =
    activeBucket?.range === range && activeBucket.index < buckets.length
      ? activeBucket.index
      : null;
  const maxValue = getNiceChartMax(
    Math.max(0, ...series.flatMap((item) => item.periodCounts)),
  );
  const yAxisSteps = buildYAxisSteps(maxValue);
  const chartSeries = series.map((item, seriesIndex) => {
    const points = buildLineChartPoints(item.periodCounts, maxValue)
      .map((point, index) => ({
        ...point,
        index,
        value: item.periodCounts[index] || 0,
      }))
      .filter((point) => buckets[point.index]?.start <= updatedAt);

    return {
      ...item,
      points,
      seriesIndex,
    };
  });
  const axisBuckets =
    range === "months"
      ? buckets
          .filter((_, index) => index % 4 === 0)
          .map((bucket) => ({
            ...bucket,
            label: bucket.start.toLocaleDateString("en-US", {
              month: "short",
            }),
            shortLabel: String(bucket.start.getFullYear()),
          }))
      : buckets;
  const hasActivity = series.some((item) =>
    item.periodCounts.some((value) => value > 0),
  );
  const activeX =
    activeBucketIndex === null
      ? null
      : (chartSeries[0]?.points[activeBucketIndex]?.x ?? null);
  const rangeDescription =
    range === "years"
      ? "New activity by year"
      : range === "months"
        ? "Activity within each month"
        : "New activity by day";
  const chartExplanation =
    range === "months"
      ? "Points are positioned within each month based on when activity happened."
      : "Each point shows records added in that period.";

  return (
    <div className="bg-slate-50/70 p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-slate-900">
              {rangeDescription}
            </p>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Live data
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {formatActivityDateRange(range, buckets)}. {chartExplanation}
          </p>
        </div>
        <p className="text-xs font-medium tabular-nums text-slate-500">
          Updated{" "}
          {updatedAt.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          })}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
        {series.map((item, index) => {
          const visibleTotal = item.periodCounts.reduce(
            (total, value) => total + value,
            0,
          );

          return (
            <div
              key={item.key}
              className="relative overflow-hidden rounded-xl border border-slate-200 bg-white px-3.5 py-3 shadow-[0_8px_24px_-22px_rgba(15,23,42,0.45)]"
            >
              <span
                className="absolute inset-x-0 top-0 h-0.5"
                style={{ backgroundColor: item.accent }}
              />
              <div className="flex items-center gap-2">
                <svg
                  viewBox="0 0 36 8"
                  className="h-2 w-9 shrink-0"
                  aria-hidden="true"
                >
                  <line
                    x1="1"
                    y1="4"
                    x2="35"
                    y2="4"
                    stroke={item.accent}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={ACTIVITY_SERIES_DASHES[index]}
                  />
                </svg>
                <p className="truncate text-xs font-semibold text-slate-600">
                  {item.label}
                </p>
              </div>
              <div className="mt-2 flex items-end justify-between gap-2">
                <p className="text-2xl font-semibold leading-none tabular-nums text-slate-950">
                  {item.total}
                </p>
                <p className="text-right text-[11px] font-semibold tabular-nums text-slate-500">
                  +{visibleTotal} in view
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:px-5">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Activity trend
            </p>
          </div>
          <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">
            New records
          </span>
        </div>

        <div className="overflow-x-auto px-4 pb-4 pt-5 sm:px-5 sm:pb-5">
          <div className="min-w-[620px]">
            <div className="grid grid-cols-[34px_minmax(0,1fr)] gap-3">
              <div className="flex h-[270px] flex-col justify-between text-right text-[11px] font-semibold tabular-nums text-slate-400">
                {yAxisSteps.map((value) => (
                  <span key={value}>{value}</span>
                ))}
              </div>

              <div className="min-w-0">
                <div
                  className="relative h-[270px]"
                  onMouseLeave={() => setActiveBucket(null)}
                >
                  <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
                    {yAxisSteps.map((value) => (
                      <div
                        key={value}
                        className="border-t border-dashed border-slate-200"
                      />
                    ))}
                  </div>
                  <div
                    className="pointer-events-none absolute inset-0 grid"
                    style={{
                      gridTemplateColumns: `repeat(${axisBuckets.length}, minmax(0, 1fr))`,
                    }}
                  >
                    {axisBuckets.map((bucket, index) => (
                      <div
                        key={`guide-${bucket.key}`}
                        className={
                          index === 0 ? "" : "border-l border-slate-100/80"
                        }
                      />
                    ))}
                  </div>

                  {hasActivity ? (
                    <svg
                      viewBox={`0 0 ${ACTIVITY_CHART_WIDTH} ${ACTIVITY_CHART_HEIGHT}`}
                      preserveAspectRatio="none"
                      className="relative z-10 h-full w-full overflow-visible"
                      role="img"
                      aria-label="New platform activity by selected period"
                    >
                      <defs>
                        <linearGradient
                          id="activity-area-gradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#2563eb"
                            stopOpacity="0.18"
                          />
                          <stop
                            offset="100%"
                            stopColor="#2563eb"
                            stopOpacity="0"
                          />
                        </linearGradient>
                      </defs>
                      {chartSeries[0]?.points.length ? (
                        <path
                          d={buildAreaPath(chartSeries[0].points)}
                          fill="url(#activity-area-gradient)"
                        />
                      ) : null}
                      {chartSeries.map((item, index) => (
                        <path
                          key={item.key}
                          d={buildSmoothLinePath(item.points)}
                          fill="none"
                          stroke={item.accent}
                          strokeWidth={index === 0 ? "3.5" : "3"}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeDasharray={ACTIVITY_SERIES_DASHES[index]}
                          vectorEffect="non-scaling-stroke"
                        />
                      ))}
                    </svg>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
                      <div>
                        <p className="text-sm font-semibold text-slate-700">
                          No new activity in this period
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Choose another range to review earlier activity.
                        </p>
                      </div>
                    </div>
                  )}

                  {hasActivity
                    ? chartSeries.map((item) =>
                        item.points
                          .filter((point) => point.value > 0)
                          .map((point) => (
                            <span
                              key={`point-${item.key}-${point.index}`}
                              className={`pointer-events-none absolute z-20 rounded-full border-2 border-white shadow-sm transition-[width,height] duration-200 ${
                                activeBucketIndex === point.index
                                  ? "h-3.5 w-3.5"
                                  : "h-2.5 w-2.5"
                              }`}
                              style={{
                                left: `${(point.x / ACTIVITY_CHART_WIDTH) * 100}%`,
                                top: `${(point.y / ACTIVITY_CHART_HEIGHT) * 100}%`,
                                backgroundColor: item.accent,
                                transform: `translate(calc(-50% + ${(item.seriesIndex - 1.5) * 2}px), -50%)`,
                              }}
                            />
                          )),
                      )
                    : null}

                  {activeX !== null && activeBucketIndex !== null ? (
                    <>
                      <div
                        className="pointer-events-none absolute inset-y-0 z-10 border-l border-blue-300"
                        style={{
                          left: `${(activeX / ACTIVITY_CHART_WIDTH) * 100}%`,
                        }}
                      />
                      <div
                        className="pointer-events-none absolute top-3 z-30 w-[210px] -translate-x-1/2 rounded-xl border border-slate-200 bg-white p-3 shadow-[0_18px_45px_-22px_rgba(15,23,42,0.45)]"
                        style={{ left: getTooltipLeft(activeX) }}
                      >
                        <p className="text-xs font-bold text-slate-900">
                          {formatBucketTitle(buckets[activeBucketIndex])}
                        </p>
                        <div className="mt-2 space-y-1.5">
                          {series.map((item) => (
                            <div
                              key={item.key}
                              className="flex items-center justify-between gap-3 text-[11px]"
                            >
                              <span className="flex min-w-0 items-center gap-2 text-slate-600">
                                <span
                                  className="h-2 w-2 shrink-0 rounded-full"
                                  style={{ backgroundColor: item.accent }}
                                />
                                <span className="truncate">{item.label}</span>
                              </span>
                              <span className="font-bold tabular-nums text-slate-900">
                                +{item.periodCounts[activeBucketIndex] || 0}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : null}

                  {buckets.map((bucket, index) => {
                    if (bucket.start > updatedAt) return null;

                    const accessibilitySummary = series
                      .map((item) =>
                        formatActivityDetail(
                          item.key,
                          item.total,
                          item.periodCounts[index] || 0,
                        ),
                      )
                      .join(". ");

                    return (
                      <button
                        type="button"
                        key={`hit-area-${bucket.key}`}
                        className="absolute inset-y-0 z-20 focus-visible:bg-blue-50/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-400"
                        style={{
                          left: `${(index / buckets.length) * 100}%`,
                          width: `${100 / buckets.length}%`,
                        }}
                        aria-label={`${formatBucketTitle(bucket)}. ${accessibilitySummary}`}
                        onMouseEnter={() => setActiveBucket({ range, index })}
                        onFocus={() => setActiveBucket({ range, index })}
                        onBlur={() => setActiveBucket(null)}
                        onClick={() => setActiveBucket({ range, index })}
                      >
                        <span className="sr-only">
                          View activity for {formatBucketTitle(bucket)}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div
                  className="mt-3 grid gap-2"
                  style={{
                    gridTemplateColumns: `repeat(${axisBuckets.length}, minmax(0, 1fr))`,
                  }}
                >
                  {axisBuckets.map((bucket) => {
                    const upcoming = bucket.start > updatedAt;

                    return (
                      <div key={bucket.key} className="min-w-0 text-center">
                        <p
                          className={`truncate text-xs font-semibold ${
                            upcoming ? "text-slate-300" : "text-slate-600"
                          }`}
                        >
                          {bucket.label}
                        </p>
                        {bucket.shortLabel ? (
                          <p
                            className={`mt-0.5 truncate text-[11px] ${
                              upcoming ? "text-slate-300" : "text-slate-400"
                            }`}
                          >
                            {bucket.shortLabel}
                          </p>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <table className="sr-only">
            <caption>
              Platform activity values for{" "}
              {formatActivityDateRange(range, buckets)}
            </caption>
            <thead>
              <tr>
                <th scope="col">Period</th>
                {series.map((item) => (
                  <th key={item.key} scope="col">
                    {item.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {buckets.map((bucket, index) => (
                <tr key={`table-${bucket.key}`}>
                  <th scope="row">{formatBucketTitle(bucket)}</th>
                  {series.map((item) => (
                    <td key={item.key}>
                      {bucket.start > updatedAt
                        ? "Upcoming"
                        : item.periodCounts[index] || 0}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
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
    { value: "years", label: "6 Years" },
    { value: "months", label: "6 Months" },
    { value: "weeks", label: "7 Days" },
  ];

  return (
    <div
      className="grid grid-cols-3 rounded-xl border border-slate-200 bg-slate-50 p-1"
      aria-label="Activity date range"
    >
      {options.map((option) => {
        const active = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={active}
            className={`min-h-11 rounded-lg px-3 py-2 text-xs font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-1 ${
              active
                ? "bg-[#1d4ed8] text-white shadow-sm"
                : "text-slate-500 hover:bg-white hover:text-slate-800"
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
        <div className="flex-1 text-sm font-medium text-slate-800">
          {category.label}
        </div>
        <span className="text-sm text-slate-500">{category.value}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-200">
        <div
          className="h-2 rounded-full"
          style={{ width: category.value, backgroundColor: category.accent }}
        />
      </div>
    </div>
  );
}

function buildActivityBuckets(range: ActivityRange, now: Date) {
  if (range === "weeks") {
    return Array.from({ length: 7 }, (_, index) => {
      const start = startOfDay(addDays(now, index - 6));
      const end = addDays(start, 1);

      return {
        key: start.toISOString(),
        label: start.toLocaleDateString("en-US", { weekday: "short" }),
        shortLabel: start.toLocaleDateString("en-US", {
          day: "numeric",
          month: "short",
        }),
        start,
        end,
      };
    });
  }

  if (range === "months") {
    const buckets: ActivityBucket[] = [];

    for (let monthIndex = 0; monthIndex < 6; monthIndex += 1) {
      const monthStart = new Date(
        MONTHLY_ACTIVITY_START.getFullYear(),
        MONTHLY_ACTIVITY_START.getMonth() + monthIndex,
        1,
      );
      const nextMonth = new Date(
        monthStart.getFullYear(),
        monthStart.getMonth() + 1,
        1,
      );

      [1, 8, 15, 22].forEach((day, segmentIndex) => {
        const start = new Date(
          monthStart.getFullYear(),
          monthStart.getMonth(),
          day,
        );
        const end =
          segmentIndex === 3
            ? nextMonth
            : new Date(
                monthStart.getFullYear(),
                monthStart.getMonth(),
                day + 7,
              );
        const finalDay = addDays(end, -1).getDate();
        const monthLabel = monthStart.toLocaleDateString("en-US", {
          month: "short",
        });

        buckets.push({
          key: `${monthStart.getFullYear()}-${monthStart.getMonth()}-${segmentIndex}`,
          label: `${monthLabel} ${day}-${finalDay}`,
          shortLabel: String(monthStart.getFullYear()),
          start,
          end,
        });
      });
    }

    return buckets;
  }

  return Array.from({ length: 6 }, (_, index) => {
    const year = YEARLY_ACTIVITY_START_YEAR + index;
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

function buildLineChartPoints(counts: Array<number | null>, maxValue: number) {
  const chartTopPadding = 12;
  const chartBottomPadding = 18;
  const plotHeight =
    ACTIVITY_CHART_HEIGHT - chartTopPadding - chartBottomPadding;
  const slotWidth = ACTIVITY_CHART_WIDTH / Math.max(counts.length, 1);

  return counts.map((value, index) => {
    const safeValue = value || 0;

    return {
      x: slotWidth * (index + 0.5),
      y: chartTopPadding + (1 - safeValue / maxValue) * plotHeight,
    };
  });
}

function buildSmoothLinePath(points: Array<{ x: number; y: number }>) {
  if (!points.length) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  return points.slice(1).reduce((path, point, index) => {
    const previous = points[index];
    const controlX = (previous.x + point.x) / 2;
    return `${path} C ${controlX} ${previous.y}, ${controlX} ${point.y}, ${point.x} ${point.y}`;
  }, `M ${points[0].x} ${points[0].y}`);
}

function buildAreaPath(points: ActivityChartPoint[]) {
  if (!points.length) return "";
  const baseline = ACTIVITY_CHART_HEIGHT - 18;
  const firstPoint = points[0];
  const lastPoint = points.at(-1) || firstPoint;

  return `${buildSmoothLinePath(points)} L ${lastPoint.x} ${baseline} L ${firstPoint.x} ${baseline} Z`;
}

function formatBucketTitle(bucket?: ActivityBucket) {
  if (!bucket) return "Selected period";
  return [bucket.label, bucket.shortLabel].filter(Boolean).join(" ");
}

function formatActivityDateRange(
  range: ActivityRange,
  buckets: ActivityBucket[],
) {
  const first = buckets[0]?.start;
  const last = buckets.at(-1)?.start;
  if (!first || !last) return "Current activity";

  if (range === "years") {
    return `${first.getFullYear()} - ${last.getFullYear()}`;
  }

  if (range === "months") {
    const firstLabel = first.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
    const lastLabel = last.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
    return `${firstLabel} - ${lastLabel}`;
  }

  const firstLabel = first.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const lastLabel = last.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `${firstLabel} - ${lastLabel}`;
}

function getTooltipLeft(x: number) {
  return `clamp(105px, ${(x / ACTIVITY_CHART_WIDTH) * 100}%, calc(100% - 105px))`;
}

function formatActivityDetail(
  key: ActivitySeriesKey,
  total: number,
  periodValue: number,
) {
  const labels: Record<
    ActivitySeriesKey,
    { singular: string; plural: string; action: string }
  > = {
    users: { singular: "user", plural: "users", action: "joined" },
    providers: { singular: "provider", plural: "providers", action: "joined" },
    buyers: { singular: "buyer", plural: "buyers", action: "joined" },
    gigs: { singular: "gig", plural: "gigs", action: "created" },
  };
  const label = labels[key];
  const periodNoun = periodValue === 1 ? label.singular : label.plural;
  const totalNoun = total === 1 ? label.singular : label.plural;

  if (periodValue > 0) {
    return `${periodValue} ${periodNoun} ${label.action}; ${total} total ${totalNoun}`;
  }

  return `${total} total ${totalNoun}; no new this period`;
}

function mergeDashboardGigs(firestoreGigs: GigRecord[], users: UserRecord[]) {
  const merged = new Map<string, GigRecord>();

  firestoreGigs.forEach((gig, index) => {
    const key = gig.id || gig.gigId || `${gig.title || "gig"}-${index}`;
    merged.set(key, gig);
  });

  users.forEach((user) => {
    if (!["provider", "both"].includes(normalizeAdminRole(user.role))) return;

    user.providerProfile?.gigs?.forEach((gig, index) => {
      const key =
        gig.id ||
        gig.gigId ||
        `${user.createdAt || user.updatedAt || "profile"}-${gig.title || "gig"}-${index}`;
      if (merged.has(key)) return;

      merged.set(key, {
        ...gig,
        id: key,
        status: gig.status || gig.gigStatus || "active",
        createdAt:
          gig.createdAt ||
          user.providerApprovedAt ||
          user.createdAt ||
          user.updatedAt,
        updatedAt: gig.updatedAt || user.updatedAt,
      });
    });
  });

  return [...merged.values()];
}

function buildActivitySeries(
  key: ActivitySeriesKey,
  label: string,
  accent: string,
  records: object[],
  buckets: ActivityBucket[],
  now: Date,
  dateFields: string[],
): ActivitySeries {
  const datedRecords = records
    .map((record) => getFirstDateValue(record, dateFields))
    .filter((date): date is Date => Boolean(date));
  const counts = buckets.map((bucket) => {
    if (bucket.start > now) return null;
    const bucketEnd = bucket.end > now ? now : bucket.end;

    return datedRecords.filter((recordDate) => recordDate < bucketEnd).length;
  });
  const periodCounts = buckets.map((bucket) => {
    if (bucket.start > now) return 0;
    const bucketEnd = bucket.end > now ? now : bucket.end;

    return datedRecords.filter(
      (recordDate) => recordDate >= bucket.start && recordDate < bucketEnd,
    ).length;
  });

  return {
    key,
    label,
    accent,
    counts,
    periodCounts,
    total: datedRecords.filter((recordDate) => recordDate <= now).length,
  };
}

function getFirstDateValue(record: object, dateFields: string[]) {
  const values = record as Record<string, TimestampLike>;

  for (const field of dateFields) {
    const date = toDateValue(values[field]);
    if (date) return date;
  }

  return null;
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

    const seconds =
      typeof value.seconds === "number" ? value.seconds : value._seconds;
    const nanoseconds =
      typeof value.nanoseconds === "number"
        ? value.nanoseconds
        : value._nanoseconds;
    if (typeof seconds === "number") {
      const millis = seconds * 1000 + Math.floor((nanoseconds || 0) / 1000000);
      const nextDate = new Date(millis);
      return Number.isNaN(nextDate.getTime()) ? null : nextDate;
    }

    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function toMillis(value: TimestampLike) {
  const date = toDateValue(value);
  return date ? date.getTime() : 0;
}

function startOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function addDays(value: Date, days: number) {
  const date = new Date(value);
  date.setDate(date.getDate() + days);
  return date;
}

function getNiceChartMax(value: number) {
  return Math.max(4, Math.ceil(value / 4) * 4);
}

function buildYAxisSteps(maxValue: number) {
  return [maxValue, maxValue * 0.75, maxValue * 0.5, maxValue * 0.25, 0];
}

function UsersIcon() {
  return (
    <Icon path="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75" />
  );
}

function BadgeCheckIcon() {
  return (
    <Icon path="M12 2.8 6.8 5.1v4.7c0 4 2.3 6.8 5.2 8.4 2.9-1.6 5.2-4.4 5.2-8.4V5.1L12 2.8Z m-2.3 8.1 1.6 1.7 3.2-3.4" />
  );
}

function ClipboardIcon() {
  return (
    <Icon path="M6 4.75h12v15.5H6z M9 4.75h6 M9 10.5h6 M9 14h6 M9 17.5h3.5" />
  );
}

function FlagIcon() {
  return <Icon path="M5.5 4v16 M5.5 5h9l-1.8 3 1.8 3h-9" />;
}

function ShieldIcon() {
  return (
    <Icon path="M12 3 5.5 5.9v5.7c0 4.4 2.8 7.2 6.5 8.9 3.7-1.7 6.5-4.5 6.5-8.9V5.9L12 3Z m-2.6 8.9 1.8 1.8 3.6-3.8" />
  );
}

function OfferIcon() {
  return (
    <Icon path="M5.5 7.5h9.8a2 2 0 0 1 1.4.6l1.8 1.8a2 2 0 0 1 0 2.8l-5.7 5.7a2 2 0 0 1-2.8 0l-4.5-4.5a2 2 0 0 1 0-2.8l2.8-2.8a2 2 0 0 1 1.2-.6Z M14.5 7.5v4h4" />
  );
}

function BuyerGroupIcon() {
  return (
    <Icon path="M16 21v-2.2a3.8 3.8 0 0 0-3.8-3.8H7.8A3.8 3.8 0 0 0 4 18.8V21 M10 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7 M17.5 11.5 19 13l3-3.2" />
  );
}

function CompletedOrdersIcon() {
  return (
    <Icon path="M8 7h10l1.4 2.4v7.6A2 2 0 0 1 17.4 19H8a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z M10 7V5.8A1.8 1.8 0 0 1 11.8 4h2.4A1.8 1.8 0 0 1 16 5.8V7 M9.5 12.2l2 2 3.7-3.9" />
  );
}

function ActiveGigsIcon() {
  return (
    <Icon path="M7 6.5h3l1.2-1.8h1.6L14 6.5h3A2.2 2.2 0 0 1 19.2 8.7v7.6A2.2 2.2 0 0 1 17 18.5H7A2.2 2.2 0 0 1 4.8 16.3V8.7A2.2 2.2 0 0 1 7 6.5Z M9 11.7h6 M9 14.7h3.8" />
  );
}

function CategoryIcon() {
  return <Icon path="M4 7h16 M4 12h16 M4 17h16" />;
}

function Icon({ path }: { path: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {path.split(" M").map((segment, index) => (
        <path key={index} d={index === 0 ? segment : `M${segment}`} />
      ))}
    </svg>
  );
}
