"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { collection, doc, onSnapshot, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { createNotification } from "@/lib/notifications";
import SelectField from "@/components/ui/select-field";

type TimestampLike =
  | { toDate?: () => Date; toMillis?: () => number }
  | Date
  | string
  | number
  | null
  | undefined;

type EvidenceFile = {
  name?: string;
  url?: string;
  type?: string;
  size?: number;
};

type ReportRecord = {
  id: string;
  reporterId?: string;
  reporterName?: string;
  reporterEmail?: string;
  targetUserId?: string;
  targetUserName?: string;
  reportedUserId?: string;
  reportedUserName?: string;
  reportedUser?: string;
  requestId?: string;
  orderId?: string;
  category?: string;
  issueType?: string;
  description?: string;
  evidenceFiles?: EvidenceFile[];
  status?: string;
  adminNote?: string;
  adminAction?: string;
  createdAt?: TimestampLike;
  resolvedAt?: TimestampLike;
};

const statusFilters = ["All Reports", "Pending", "Resolved", "Rejected"];

export default function AdminIssueResolution() {
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState(statusFilters[0]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState("");
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "reports"),
      (snapshot) => {
        const nextReports = snapshot.docs
          .map((docSnap) => ({
            id: docSnap.id,
            ...(docSnap.data() as Omit<ReportRecord, "id">),
          }))
          .sort((left, right) => toMillis(right.createdAt) - toMillis(left.createdAt));

        setReports(nextReports);
        setLoading(false);
      },
      (error) => {
        console.error("Error loading reports:", error);
        setNotice({ type: "error", text: "Could not load reports from Firestore." });
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const matchesStatus =
        statusFilter === "All Reports" ||
        normalizeStatus(report.status || "Pending") === normalizeStatus(statusFilter);

      return matchesStatus;
    });
  }, [reports, statusFilter]);

  const pendingReports = reports.filter(
    (report) => normalizeStatus(report.status || "Pending") === "pending",
  );
  const warnedReports = reports.filter((report) => report.adminAction === "warning_sent");
  const resolvedToday = reports.filter((report) => {
    if (normalizeStatus(report.status || "") !== "resolved") return false;
    return isToday(report.resolvedAt);
  });

  const updateReportStatus = async (report: ReportRecord, nextStatus: "Resolved" | "Rejected") => {
    const note = notes[report.id]?.trim() || report.adminNote || "";
    setBusyKey(`${report.id}-${nextStatus}`);
    setNotice(null);

    try {
      await updateDoc(doc(db, "reports", report.id), {
        status: nextStatus,
        adminNote: note,
        updatedAt: serverTimestamp(),
        resolvedAt: serverTimestamp(),
      });

      if (report.reporterId) {
        await createNotification({
          userId: report.reporterId,
          title: "Report status updated",
          description: `Your report is now ${nextStatus.toLowerCase()}.`,
          type: "system",
          icon: nextStatus === "Resolved" ? "check-circle" : "x-circle",
          tone: nextStatus === "Resolved" ? "emerald" : "red",
          href: "/notifications",
          destination: "/notifications",
        });
      }

      setNotice({ type: "success", text: `Report ${formatReportId(report.id)} marked ${nextStatus}.` });
    } catch (error) {
      console.error("Error updating report:", error);
      setNotice({ type: "error", text: "Could not update the report." });
    } finally {
      setBusyKey("");
    }
  };

  const warnUser = async (report: ReportRecord) => {
    const targetUserId = reportedUserId(report);
    if (!targetUserId) {
      setNotice({ type: "error", text: "This report does not include a reported user ID." });
      return;
    }

    setBusyKey(`${report.id}-warn`);
    setNotice(null);

    try {
      await updateDoc(doc(db, "reports", report.id), {
        adminAction: "warning_sent",
        adminNote: notes[report.id]?.trim() || report.adminNote || "",
        updatedAt: serverTimestamp(),
      });

      await createNotification({
        userId: targetUserId,
        title: "Account warning",
        description: "Admin reviewed a report related to your account. Please follow platform rules.",
        type: "system",
        icon: "alert-triangle",
        tone: "red",
        href: "/notifications",
        destination: "/notifications",
      });

      setNotice({ type: "success", text: `Warning sent to ${reportedUserName(report)}.` });
    } catch (error) {
      console.error("Error warning user:", error);
      setNotice({ type: "error", text: "Could not send the account warning." });
    } finally {
      setBusyKey("");
    }
  };

  const suspendUser = async (report: ReportRecord) => {
    const targetUserId = reportedUserId(report);
    if (!targetUserId) {
      setNotice({ type: "error", text: "This report does not include a reported user ID." });
      return;
    }

    setBusyKey(`${report.id}-suspend`);
    setNotice(null);

    try {
      await updateDoc(doc(db, "users", targetUserId), {
        accountStatus: "suspended",
        updatedAt: serverTimestamp(),
      });

      await updateDoc(doc(db, "reports", report.id), {
        status: "Resolved",
        adminAction: "account_suspended",
        adminNote: notes[report.id]?.trim() || report.adminNote || "",
        updatedAt: serverTimestamp(),
        resolvedAt: serverTimestamp(),
      });

      await createNotification({
        userId: targetUserId,
        title: "Account suspended",
        description: "Your Skill Swap Hub account has been suspended after admin report review.",
        type: "system",
        icon: "alert-triangle",
        tone: "red",
        href: "/notifications",
        destination: "/notifications",
      });

      if (report.reporterId) {
        await createNotification({
          userId: report.reporterId,
          title: "Report resolved",
          description: "Admin reviewed your report and took action.",
          type: "system",
          icon: "check-circle",
          tone: "emerald",
          href: "/notifications",
          destination: "/notifications",
        });
      }

      setNotice({ type: "success", text: `${reportedUserName(report)} has been suspended.` });
    } catch (error) {
      console.error("Error suspending user:", error);
      setNotice({ type: "error", text: "Could not suspend the reported user." });
    } finally {
      setBusyKey("");
    }
  };

  return (
    <div className="px-6 py-10">
      <section className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-3xl">
          <h1 className="text-[30px] font-semibold leading-tight tracking-tight text-slate-900">
            Manage Flagged Issues
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Review report evidence, warn users, suspend accounts, and close trust cases.
          </p>

          <div className="mt-4 flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-600">
            <InfoIcon />
            <p>
              Admin reviews report evidence only when a buyer or provider submits an issue after a service.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-[220px_auto] xl:items-end">
          <div className="min-w-0">
            <SelectField
              label="Report Status"
              value={statusFilter}
              onChange={setStatusFilter}
              options={statusFilters}
              title="Filter reports by status"
              wrapperClassName="min-w-0"
              labelClassName="mb-0 text-sm font-medium text-slate-600"
              className="h-12 rounded-xl border-slate-200 px-4 text-sm font-medium text-slate-700 shadow-sm"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              setStatusFilter(statusFilters[0]);
            }}
            className="inline-flex h-12 w-12 items-center justify-center self-end rounded-xl border border-slate-200 bg-slate-50 text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
            aria-label="Clear report filters"
          >
            <FilterResetIcon />
          </button>
        </div>
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-3">
        <StatCard label="Pending Reports" value={pendingReports.length} tone="orange" />
        <StatCard label="Warnings Sent" value={warnedReports.length} tone="blue" />
        <StatCard label="Resolved Today" value={resolvedToday.length} tone="teal" />
      </section>

      {notice ? (
        <div
          className={`mt-5 rounded-xl border px-4 py-3 text-sm font-medium ${
            notice.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {notice.text}
        </div>
      ) : null}

      <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <div className="min-w-[1180px]">
            <div className="grid grid-cols-[0.8fr_1fr_1fr_0.9fr_1.35fr_0.9fr_0.75fr_1.3fr] border-b border-slate-200 bg-[#f6f7ff] px-4 py-4 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              <span>Report ID</span>
              <span>Reporter</span>
              <span>Reported User</span>
              <span>Issue Type</span>
              <span>Description &amp; Evidence</span>
              <span>Date</span>
              <span>Status</span>
              <span>Actions</span>
            </div>

            {loading ? (
              <EmptyRow>Loading reports...</EmptyRow>
            ) : filteredReports.length === 0 ? (
              <EmptyRow>No reports found.</EmptyRow>
            ) : (
              filteredReports.map((report) => {
                const status = report.status || "Pending";
                const evidence = Array.isArray(report.evidenceFiles) ? report.evidenceFiles : [];

                return (
                  <div
                    key={report.id}
                    className="grid grid-cols-[0.8fr_1fr_1fr_0.9fr_1.35fr_0.9fr_0.75fr_1.3fr] items-start gap-3 border-b border-slate-200 px-4 py-4 text-sm last:border-b-0"
                  >
                    <span className="font-medium text-slate-600">{formatReportId(report.id)}</span>
                    <ReportedUser name={report.reporterName || "Reporter"} detail={report.reporterEmail} />
                    <ReportedUser name={reportedUserName(report)} detail={reportedUserId(report)} />
                    <span className="inline-flex w-fit rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-500">
                      {report.issueType || report.category || "Other"}
                    </span>
                    <div className="min-w-0">
                      <p className="line-clamp-3 leading-6 text-slate-600">
                        {report.description || "No description provided."}
                      </p>
                      {evidence.length ? (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {evidence.map((file, index) =>
                            file.url ? (
                              <a
                                key={`${file.url}-${index}`}
                                href={file.url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-[#2563eb] hover:bg-blue-50"
                              >
                                Evidence {index + 1}
                              </a>
                            ) : null,
                          )}
                        </div>
                      ) : (
                        <p className="mt-2 text-xs text-slate-400">No evidence attached</p>
                      )}
                      <textarea
                        value={notes[report.id] ?? report.adminNote ?? ""}
                        onChange={(event) =>
                          setNotes((current) => ({ ...current, [report.id]: event.target.value }))
                        }
                        placeholder="Admin note"
                        className="mt-3 h-20 w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 outline-none focus:border-[#2f66e7] focus:ring-4 focus:ring-blue-100"
                      />
                    </div>
                    <span className="whitespace-pre-line text-slate-600">{formatDate(report.createdAt)}</span>
                    <StatusPill status={status} />
                    <div className="flex flex-wrap gap-2">
                      <ActionButton
                        busy={busyKey === `${report.id}-warn`}
                        disabled={busyKey !== ""}
                        onClick={() => warnUser(report)}
                      >
                        Warn
                      </ActionButton>
                      <ActionButton
                        tone="danger"
                        busy={busyKey === `${report.id}-suspend`}
                        disabled={busyKey !== ""}
                        onClick={() => suspendUser(report)}
                      >
                        Suspend
                      </ActionButton>
                      <ActionButton
                        tone="success"
                        busy={busyKey === `${report.id}-Resolved`}
                        disabled={busyKey !== ""}
                        onClick={() => updateReportStatus(report, "Resolved")}
                      >
                        Resolve
                      </ActionButton>
                      <ActionButton
                        tone="muted"
                        busy={busyKey === `${report.id}-Rejected`}
                        disabled={busyKey !== ""}
                        onClick={() => updateReportStatus(report, "Rejected")}
                      >
                        Reject
                      </ActionButton>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 px-4 py-4 text-sm text-slate-500">
          <p>
            Showing {filteredReports.length} of {reports.length} reports
          </p>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "orange" | "blue" | "teal";
}) {
  const accent =
    tone === "orange"
      ? "border-orange-200 bg-orange-50 text-orange-700 hover:border-orange-300 hover:bg-orange-100/70"
      : tone === "blue"
        ? "border-blue-200 bg-blue-50 text-blue-700 hover:border-blue-300 hover:bg-blue-100/70"
        : "border-teal-200 bg-teal-50 text-teal-700 hover:border-teal-300 hover:bg-teal-100/70";

  return (
    <article className={`rounded-2xl border p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:scale-[1.01] hover:shadow-md ${accent}`}>
      <div className="flex min-h-[78px] flex-col justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
        <p className="mt-2 text-3xl font-semibold leading-none tracking-tight text-slate-900">{value}</p>
      </div>
    </article>
  );
}

function EmptyRow({ children }: { children: ReactNode }) {
  return <div className="px-6 py-12 text-center text-sm font-medium text-slate-500">{children}</div>;
}

function ReportedUser({ name, detail }: { name: string; detail?: string }) {
  const letter = name[0]?.toUpperCase() ?? "?";
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">
        {letter}
      </span>
      <span className="min-w-0">
        <span className="block truncate font-medium text-slate-700">{name}</span>
        {detail ? <span className="block truncate text-xs text-slate-400">{detail}</span> : null}
      </span>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const normalized = normalizeStatus(status);
  const styles =
    normalized === "pending"
      ? "bg-orange-100 text-orange-700"
      : normalized === "resolved"
        ? "bg-teal-100 text-teal-700"
        : "bg-red-100 text-red-700";

  return (
    <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${styles}`}>
      {status}
    </span>
  );
}

function ActionButton({
  children,
  onClick,
  disabled,
  busy,
  tone = "default",
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  busy?: boolean;
  tone?: "default" | "danger" | "success" | "muted";
}) {
  const styles =
    tone === "danger"
      ? "bg-[#ef295a] text-white hover:bg-[#db1f4d]"
      : tone === "success"
        ? "bg-emerald-600 text-white hover:bg-emerald-700"
        : tone === "muted"
          ? "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          : "bg-[#2f66e7] text-white hover:bg-[#2356cb]";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-9 items-center justify-center rounded-lg px-3 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${styles}`}
    >
      {busy ? "Saving..." : children}
    </button>
  );
}

function reportedUserId(report: ReportRecord) {
  return report.targetUserId || report.reportedUserId || report.reportedUser || "";
}

function reportedUserName(report: ReportRecord) {
  return report.targetUserName || report.reportedUserName || report.reportedUser || "Reported user";
}

function normalizeStatus(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "_").replace(/-/g, "_");
}

function toMillis(value: TimestampLike) {
  if (!value) return 0;
  if (typeof value === "object" && "toMillis" in value && typeof value.toMillis === "function") {
    return value.toMillis();
  }
  if (typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate().getTime();
  }
  if (value instanceof Date) return value.getTime();
  if (typeof value === "object") return 0;
  return new Date(value).getTime() || 0;
}

function formatDate(value: TimestampLike) {
  const millis = toMillis(value);
  if (!millis) return "Not recorded";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(millis));
}

function isToday(value: TimestampLike) {
  const millis = toMillis(value);
  if (!millis) return false;
  const today = new Date();
  const date = new Date(millis);
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

function formatReportId(id: string) {
  return `#ISS-${id.slice(-5).toUpperCase()}`;
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 10v5" />
      <path d="M12 7h.01" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function FilterResetIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7h16" />
      <path d="M7 12h10" />
      <path d="M10 17h4" />
      <path d="m5 5 14 14" />
    </svg>
  );
}
