"use client";

import { useEffect, useMemo, useState, type MouseEvent, type ReactNode } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { SERVICE_CATEGORIES } from "@/lib/platform";

type TimestampLike =
  | { toDate?: () => Date; seconds?: number; nanoseconds?: number; _seconds?: number; _nanoseconds?: number }
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
  createdAt?: TimestampLike;
};

type OrderRecord = {
  id?: string;
  orderStatus?: string;
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

type ActivityTooltip = {
  x: number;
  y: number;
  color: string;
  title: string;
  detail: string;
};

type ActivityChartPoint = {
  x: number;
  y: number;
  index: number;
  value: number;
  periodValue: number;
};

const YEARLY_ACTIVITY_START_YEAR = 2025;
const YEARLY_ACTIVITY_END_YEAR = 2030;
const MONTHLY_ACTIVITY_START = new Date(2026, 5, 1);
const MONTHLY_ACTIVITY_END = new Date(2026, 11, 1);
const ACTIVITY_CHART_WIDTH = 1000;
const ACTIVITY_CHART_HEIGHT = 270;

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
  const [activityNow, setActivityNow] = useState(() => new Date());

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
              ...(docSnap.data() as OrderRecord),
            })),
          );
          markLoaded("requests");
        },
        (error) => handleSnapshotError("requests", error),
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
      (user.role === "buyer" || user.role === "both"),
  );
  const activeProviders = users.filter(
    (user) =>
      normalizeStatus(user.accountStatus || "active") === "active" &&
      normalizeStatus(user.providerVerificationStatus || "") === "approved" &&
      (user.role === "provider" || user.role === "both"),
  );
  const dashboardGigs = useMemo(() => mergeDashboardGigs(gigs, users), [gigs, users]);
  const activeGigs = dashboardGigs.filter(
    (gig) => normalizeStatus(gig.status || gig.gigStatus || "active") === "active",
  );
  const completedOrders = orders.filter(
    (order) =>
      normalizeStatus(order.orderStatus || order.status || "") === "completed" &&
      Boolean(order.review) &&
      Boolean(order.providerReview),
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
    () => buildActivityBuckets(activityRange, activityNow),
    [activityRange, activityNow],
  );

  const activitySeries = useMemo<ActivitySeries[]>(() => {
    const providerUsers = users.filter(
      (user) =>
        normalizeStatus(user.accountStatus || "active") === "active" &&
        normalizeStatus(user.providerVerificationStatus || "") === "approved" &&
        (user.role === "provider" || user.role === "both"),
    );
    const buyerUsers = users.filter(
      (user) => user.role === "buyer" || user.role === "both",
    );

    return [
      buildActivitySeries("users", "Joined Users", "#2563eb", users, activityBuckets, activityNow, ["createdAt", "updatedAt"]),
      buildActivitySeries("providers", "Joined Providers", "#0f766e", providerUsers, activityBuckets, activityNow, ["providerApprovedAt", "createdAt", "updatedAt"]),
      buildActivitySeries("buyers", "Joined Buyers", "#7c3aed", buyerUsers, activityBuckets, activityNow, ["createdAt", "updatedAt"]),
      buildActivitySeries("gigs", "Created Gigs", "#d97706", dashboardGigs, activityBuckets, activityNow, ["createdAt", "updatedAt"]),
    ];
  }, [activityBuckets, activityNow, dashboardGigs, users]);

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
      href: "/admin/verifications",
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
      href: "/admin/issue-resolution",
      icon: <FlagIcon />,
      statusTone: "critical" as const,
    })),
  ]
    .sort((left, right) => {
      const leftDate = left.type === "Student Verification"
        ? pendingVerifications.find((item) => `verification-${item.id}` === left.id)?.submittedAt
        : pendingReports.find((item) => `report-${item.id}` === left.id)?.createdAt;
      const rightDate = right.type === "Student Verification"
        ? pendingVerifications.find((item) => `verification-${item.id}` === right.id)?.submittedAt
        : pendingReports.find((item) => `report-${item.id}` === right.id)?.createdAt;

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
          <ActivityPanel
            range={activityRange}
            buckets={activityBuckets}
            series={activitySeries}
          />
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
  const [tooltip, setTooltip] = useState<ActivityTooltip | null>(null);
  const maxValue = Math.max(
    3,
    ...series.flatMap((item) => item.counts.filter((value): value is number => value !== null)),
  );
  const yAxisSteps = buildYAxisSteps(maxValue);
  const chartSeries = series.map((item, seriesIndex) => {
    const points = buildLineChartPoints(item.counts, maxValue)
      .map((point, index) => ({
        ...point,
        index,
        value: item.counts[index] || 0,
        periodValue: item.periodCounts[index] || 0,
      }))
      .filter((point) => item.counts[point.index] !== null && point.value > 0);

    return {
      ...item,
      segments: buildLineChartSegments(points),
      points,
      seriesIndex,
    };
  });
  const activeBucketIndexes = new Set<number>();
  series.forEach((item) => {
    item.counts.forEach((value, index) => {
      if (value !== null && value > 0) {
        activeBucketIndexes.add(index);
      }
    });
  });
  const showNearestPointTooltip = (
    item: ActivitySeries,
    points: ActivityChartPoint[],
    event: MouseEvent<SVGPathElement>,
  ) => {
    const rect = event.currentTarget.ownerSVGElement?.getBoundingClientRect();
    if (!rect) return;

    const chartX = ((event.clientX - rect.left) / rect.width) * ACTIVITY_CHART_WIDTH;
    const nearestPoint = points.reduce((nearest, point) =>
      Math.abs(point.x - chartX) < Math.abs(nearest.x - chartX) ? point : nearest,
    );
    const bucket = buckets[nearestPoint.index];

    setTooltip({
      x: nearestPoint.x,
      y: nearestPoint.y,
      color: item.accent,
      title: formatBucketTitle(bucket),
      detail: formatActivityDetail(item.key, nearestPoint.value, nearestPoint.periodValue),
    });
  };

  return (
    <div className="mt-5 overflow-visible rounded-xl border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
      <div className="p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              {range === "years"
                ? "Yearly growth"
                : range === "months"
                  ? "Monthly growth"
                  : "Weekly growth"}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Live totals include previous activity; future periods stay blank.
            </p>
          </div>
          <div className="grid w-full grid-cols-2 gap-x-6 gap-y-2 text-xs font-semibold text-slate-500 lg:w-[430px]">
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

        <div className="mt-5 border-t border-slate-200 pt-5">
          <div className="grid min-h-[320px] grid-cols-[40px_minmax(0,1fr)] gap-4">
            <div className="flex h-[270px] flex-col justify-between text-[11px] font-semibold text-slate-400">
              {yAxisSteps.map((value, index) => (
                <span key={`${value}-${index}`}>{value}</span>
              ))}
            </div>

            <div className="min-w-0">
              <div className="relative h-[270px]">
                <div
                  className="pointer-events-none absolute inset-0 grid"
                  style={{ gridTemplateColumns: `repeat(${buckets.length}, minmax(0, 1fr))` }}
                >
                  {buckets.map((bucket, index) => (
                    <div key={`active-${bucket.key}`} className="px-1">
                      {activeBucketIndexes.has(index) ? (
                        <div className="h-full rounded-xl bg-white/70 shadow-[0_16px_34px_-30px_rgba(37,99,235,0.55)] ring-1 ring-slate-200/70" />
                      ) : null}
                    </div>
                  ))}
                </div>
                <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
                  {yAxisSteps.map((value, index) => (
                    <div key={`${value}-${index}`} className="border-t border-dashed border-slate-200/80" />
                  ))}
                </div>
                <div
                  className="pointer-events-none absolute inset-0 grid"
                  style={{ gridTemplateColumns: `repeat(${buckets.length}, minmax(0, 1fr))` }}
                >
                  {buckets.map((bucket, index) => (
                    <div
                      key={`guide-${bucket.key}`}
                      className={index === 0 ? "" : "border-l border-slate-100/80"}
                    />
                  ))}
                </div>

                <svg
                  viewBox={`0 0 ${ACTIVITY_CHART_WIDTH} ${ACTIVITY_CHART_HEIGHT}`}
                  preserveAspectRatio="none"
                  className="relative h-full w-full overflow-visible"
                  role="img"
                  aria-label="Platform activity growth line chart"
                >
                  <defs>
                    <filter id="activity-line-shadow" x="-8%" y="-18%" width="116%" height="136%">
                      <feDropShadow dx="0" dy="6" stdDeviation="5" floodColor="#64748b" floodOpacity="0.14" />
                    </filter>
                  </defs>
                  {chartSeries.map((item) => (
                    <g key={item.key}>
                      {item.segments.map((segment, segmentIndex) => (
                        <g key={`${item.key}-${segmentIndex}`}>
                          <path
                            d={buildSmoothLinePath(segment)}
                            fill="none"
                            stroke={item.accent}
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            vectorEffect="non-scaling-stroke"
                            filter="url(#activity-line-shadow)"
                          />
                          <path
                            d={buildSmoothLinePath(segment)}
                            fill="none"
                            stroke="transparent"
                            strokeWidth="18"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            vectorEffect="non-scaling-stroke"
                            pointerEvents="stroke"
                            onMouseMove={(event) => showNearestPointTooltip(item, segment, event)}
                            onMouseLeave={() => setTooltip(null)}
                          />
                        </g>
                      ))}
                    </g>
                  ))}
                </svg>

                {chartSeries.map((item) =>
                  item.points.map((point) => {
                    const bucket = buckets[point.index];
                    const markerOffset = (item.seriesIndex - 1.5) * 8;
                    const left = `calc(${(point.x / ACTIVITY_CHART_WIDTH) * 100}% + ${markerOffset}px)`;
                    const top = `${(point.y / ACTIVITY_CHART_HEIGHT) * 100}%`;
                    const nextTooltip = {
                      x: point.x + markerOffset,
                      y: point.y,
                      color: item.accent,
                      title: formatBucketTitle(bucket),
                      detail: formatActivityDetail(item.key, point.value, point.periodValue),
                    };

                    return (
                      <button
                        type="button"
                        key={`marker-${item.key}-${bucket?.key ?? point.index}`}
                        className="absolute flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full outline-none transition hover:scale-110 focus-visible:ring-4 focus-visible:ring-blue-100"
                        style={{
                          left,
                          top,
                        }}
                        aria-label={`${nextTooltip.title}: ${nextTooltip.detail}`}
                        onMouseEnter={() => setTooltip(nextTooltip)}
                        onMouseLeave={() => setTooltip(null)}
                        onFocus={() => setTooltip(nextTooltip)}
                        onBlur={() => setTooltip(null)}
                      >
                        <span
                          className="h-3.5 w-3.5 rounded-full border-[3px] border-white shadow-[0_8px_18px_rgba(15,23,42,0.18)]"
                          style={{ backgroundColor: item.accent }}
                        />
                      </button>
                    );
                  }),
                )}

                {tooltip ? (
                  <div
                    className="pointer-events-none absolute z-30 w-[210px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-left shadow-[0_18px_42px_-24px_rgba(15,23,42,0.5)]"
                    style={{
                      left: getTooltipLeft(tooltip.x),
                      top: getTooltipTop(tooltip.y),
                      transform: getTooltipTransform(tooltip.y),
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: tooltip.color }} />
                      <p className="text-[11px] font-bold text-slate-900">{tooltip.title}</p>
                    </div>
                    <p className="mt-1 text-[11px] font-medium text-slate-600">{tooltip.detail}</p>
                  </div>
                ) : null}
              </div>

              <div
                className="mt-3 grid gap-3"
                style={{ gridTemplateColumns: `repeat(${buckets.length}, minmax(0, 1fr))` }}
              >
                {buckets.map((bucket) => (
                  <div key={bucket.key} className="min-w-0 text-center">
                    <p className="truncate text-xs font-semibold text-slate-600">{bucket.label}</p>
                    {bucket.shortLabel ? (
                      <p className="mt-0.5 truncate text-[11px] text-slate-400">{bucket.shortLabel}</p>
                    ) : null}
                  </div>
                ))}
              </div>
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
    const weekStart = startOfWeek(now);

    for (let index = 0; index < 7; index += 1) {
      const start = addDays(weekStart, index);
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

    for (
      let cursor = new Date(MONTHLY_ACTIVITY_START);
      cursor <= MONTHLY_ACTIVITY_END;
      cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)
    ) {
      const start = new Date(cursor);
      const end = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
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

  return Array.from({ length: YEARLY_ACTIVITY_END_YEAR - YEARLY_ACTIVITY_START_YEAR + 1 }, (_, arrayIndex) => {
    const year = YEARLY_ACTIVITY_START_YEAR + arrayIndex;
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
  const chartSidePadding = 28;
  const chartTopPadding = 12;
  const chartBottomPadding = 18;
  const plotWidth = ACTIVITY_CHART_WIDTH - chartSidePadding * 2;
  const plotHeight = ACTIVITY_CHART_HEIGHT - chartTopPadding - chartBottomPadding;
  const lastIndex = Math.max(counts.length - 1, 1);

  return counts.map((value, index) => {
    const safeValue = value || 0;

    return {
      x: counts.length === 1 ? ACTIVITY_CHART_WIDTH / 2 : chartSidePadding + (index / lastIndex) * plotWidth,
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

function buildLineChartSegments(points: ActivityChartPoint[]) {
  const segments: Array<typeof points> = [];

  points.forEach((point) => {
    const currentSegment = segments.at(-1);
    const previousPoint = currentSegment?.at(-1);

    if (!currentSegment || !previousPoint || point.index !== previousPoint.index + 1) {
      segments.push([point]);
      return;
    }

    currentSegment.push(point);
  });

  return segments.filter((segment) => segment.length > 1);
}

function formatBucketTitle(bucket?: ActivityBucket) {
  if (!bucket) return "Selected period";
  return [bucket.label, bucket.shortLabel].filter(Boolean).join(" ");
}

function getTooltipLeft(x: number) {
  return `clamp(105px, ${(x / ACTIVITY_CHART_WIDTH) * 100}%, calc(100% - 105px))`;
}

function getTooltipTop(y: number) {
  const percent = (y / ACTIVITY_CHART_HEIGHT) * 100;
  return y < 82 ? `calc(${percent}% + 16px)` : `${percent}%`;
}

function getTooltipTransform(y: number) {
  return y < 82 ? "translate(-50%, 0)" : "translate(-50%, calc(-100% - 16px))";
}

function formatActivityDetail(key: ActivitySeriesKey, total: number, periodValue: number) {
  const labels: Record<ActivitySeriesKey, { singular: string; plural: string; action: string }> = {
    users: { singular: "user", plural: "users", action: "joined" },
    providers: { singular: "provider", plural: "providers", action: "joined" },
    buyers: { singular: "buyer", plural: "buyers", action: "joined" },
    gigs: { singular: "gig", plural: "gigs", action: "created" },
  };
  const label = labels[key];
  const periodNoun = periodValue === 1 ? label.singular : label.plural;
  const totalNoun = total === 1 ? label.singular : label.plural;

  if (periodValue > 0) {
    return `${periodValue} ${periodNoun} ${label.action} · ${total} total ${totalNoun}`;
  }

  return `${total} total ${totalNoun} · no new this period`;
}

function mergeDashboardGigs(firestoreGigs: GigRecord[], users: UserRecord[]) {
  const merged = new Map<string, GigRecord>();

  firestoreGigs.forEach((gig, index) => {
    const key = gig.id || gig.gigId || `${gig.title || "gig"}-${index}`;
    merged.set(key, gig);
  });

  users.forEach((user) => {
    if (user.role !== "provider" && user.role !== "both") return;

    user.providerProfile?.gigs?.forEach((gig, index) => {
      const key = gig.id || gig.gigId || `${user.createdAt || user.updatedAt || "profile"}-${gig.title || "gig"}-${index}`;
      if (merged.has(key)) return;

      merged.set(key, {
        ...gig,
        id: key,
        status: gig.status || gig.gigStatus || "active",
        createdAt: gig.createdAt || user.providerApprovedAt || user.createdAt || user.updatedAt,
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

    return datedRecords.filter((recordDate) => recordDate >= bucket.start && recordDate < bucketEnd).length;
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

    const seconds = typeof value.seconds === "number" ? value.seconds : value._seconds;
    const nanoseconds = typeof value.nanoseconds === "number" ? value.nanoseconds : value._nanoseconds;
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

function startOfWeek(value: Date) {
  const date = startOfDay(value);
  const day = date.getDay();
  const daysFromMonday = day === 0 ? 6 : day - 1;
  return addDays(date, -daysFromMonday);
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
