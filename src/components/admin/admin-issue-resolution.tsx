"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Timestamp, arrayUnion, collection, doc, getDoc, onSnapshot, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { createNotification } from "@/lib/notifications";
import { getAdminReportStatus, isPendingAdminReport } from "@/lib/admin-panel";
import SelectField from "@/components/ui/select-field";
import ModalPortal from "@/components/ui/modal-portal";
import AdminFilePreviewModal from "@/components/admin/admin-file-preview-modal";
import { isRole, scopedHref } from "@/lib/role-routes";
import {
  ADMIN_CONTACT_EMAIL,
  formatReportId,
  moderationActionLabel,
  moderationActionDescription,
  normalizeModerationStatus,
  queueEmail,
  toMillis,
  type ModerationAction,
  type ModerationEvidenceFile,
} from "@/lib/moderation";

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
  reportCode?: string;
  reporterId?: string;
  reporterName?: string;
  reporterEmail?: string;
  reporterRole?: string;
  targetUserId?: string;
  targetUserName?: string;
  targetUserRole?: string;
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
  decisionMessage?: string;
  adminNeedsReview?: boolean;
  lastResponseAt?: TimestampLike;
  reportedUserResponses?: Array<{
    userId?: string;
    userName?: string;
    message?: string;
    evidenceFiles?: ModerationEvidenceFile[];
    submittedAt?: TimestampLike;
  }>;
  actionHistory?: Array<{
    actorType?: "admin" | "reported_user";
    actorName?: string;
    action?: string;
    status?: string;
    message?: string;
    evidenceFiles?: ModerationEvidenceFile[];
    createdAt?: TimestampLike;
  }>;
  createdAt?: TimestampLike;
  resolvedAt?: TimestampLike;
};

type UserAvatarMap = Record<string, string>;

const statusFilters = ["All Reports", "Pending", "Warn", "Suspend", "Resolve", "Reject"];
const REPORTS_PER_PAGE = 6;

function notificationHrefForRole(role?: string) {
  return isRole(role) ? scopedHref("/notifications", role) : "/notifications";
}

export default function AdminIssueResolution() {
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState(statusFilters[0]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState("");
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [selectedReport, setSelectedReport] = useState<ReportRecord | null>(null);
  const [userAvatars, setUserAvatars] = useState<UserAvatarMap>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [previewFile, setPreviewFile] = useState<{
    title: string;
    url: string;
    contentType?: string;
    fileName?: string;
  } | null>(null);

  const getDraftNote = (reportId: string) => notes[reportId]?.trim() || "";

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      const nextAvatars = snapshot.docs.reduce<UserAvatarMap>((acc, docSnap) => {
        const data = docSnap.data() as { profileImageUrl?: string };
        if (typeof data.profileImageUrl === "string" && data.profileImageUrl.trim()) {
          acc[docSnap.id] = data.profileImageUrl;
        }
        return acc;
      }, {});

      setUserAvatars(nextAvatars);
    });

    return () => unsubscribe();
  }, []);

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
      const effectiveStatus = getAdminReportStatus(report);
      const matchesStatus =
        statusFilter === "All Reports" ||
        normalizeModerationStatus(effectiveStatus) === normalizeModerationStatus(statusFilter);

      return matchesStatus;
    });
  }, [reports, statusFilter]);
  const totalPages = Math.max(1, Math.ceil(filteredReports.length / REPORTS_PER_PAGE));
  const paginatedReports = filteredReports.slice(
    (currentPage - 1) * REPORTS_PER_PAGE,
    currentPage * REPORTS_PER_PAGE,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const pendingReports = reports.filter(
    (report) => isPendingAdminReport(report),
  );
  const warnedReports = reports.filter(
    (report) => normalizeModerationStatus(report.status || "") === "warn",
  );
  const resolvedToday = reports.filter((report) => {
    if (normalizeModerationStatus(report.status || "") !== "resolve") return false;
    return isToday(report.resolvedAt);
  });

  const updateReportStatus = async (report: ReportRecord, nextStatus: "Resolve" | "Reject") => {
    const note = getDraftNote(report.id);
    setBusyKey(`${report.id}-${nextStatus}`);
    setNotice(null);

    try {
      await updateDoc(doc(db, "reports", report.id), {
        status: nextStatus,
        adminNote: note,
        adminAction: nextStatus === "Resolve" ? "report_resolved" : "report_rejected",
        decisionMessage: note,
        adminNeedsReview: false,
        updatedAt: serverTimestamp(),
        resolvedAt: serverTimestamp(),
        actionHistory: arrayUnion({
          actorType: "admin",
          actorName: "Admin",
          action: nextStatus === "Resolve" ? "resolve_and_close" : "reject_response",
          status: nextStatus,
          message: note,
          createdAt: Timestamp.now(),
        }),
      });

      await notifyReportedUser(report, nextStatus === "Resolve" ? "resolve" : "reject", note, {
        openPopup: false,
      });

      setNotice({ type: "success", text: `Report ${formatReportId(report.reportCode || report.id)} marked ${nextStatus}.` });
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
        status: "Warn",
        adminAction: "warning_sent",
        adminNote: getDraftNote(report.id),
        decisionMessage: getDraftNote(report.id),
        adminNeedsReview: false,
        updatedAt: serverTimestamp(),
        actionHistory: arrayUnion({
          actorType: "admin",
          actorName: "Admin",
          action: "warn",
          status: "Warn",
          message: getDraftNote(report.id),
          createdAt: Timestamp.now(),
        }),
      });
      await notifyReportedUser(
        report,
        "warn",
        getDraftNote(report.id),
      );

      setNotice({ type: "success", text: `Warning sent to ${reportedUserName(report)}.` });
      setNotes((current) => ({ ...current, [report.id]: "" }));
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
        suspensionCode: "report_action",
        suspensionTitle: "Your account has been suspended by an admin",
        suspensionReason:
          getDraftNote(report.id) ||
          `Your account was suspended after admin review of ${formatReportId(report.reportCode || report.id)}.`,
        suspensionReportId: report.id,
        adminSuspensionReason: getDraftNote(report.id),
        suspendedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await updateDoc(doc(db, "reports", report.id), {
        status: "Suspend",
        adminAction: "account_suspended",
        adminNote: getDraftNote(report.id),
        decisionMessage: getDraftNote(report.id),
        adminNeedsReview: false,
        updatedAt: serverTimestamp(),
        resolvedAt: serverTimestamp(),
        actionHistory: arrayUnion({
          actorType: "admin",
          actorName: "Admin",
          action: "suspend",
          status: "Suspend",
          message: getDraftNote(report.id),
          createdAt: Timestamp.now(),
        }),
      });
      await notifyReportedUser(
        report,
        "suspend",
        getDraftNote(report.id),
      );

      setNotice({ type: "success", text: `${reportedUserName(report)} has been suspended.` });
      setNotes((current) => ({ ...current, [report.id]: "" }));
    } catch (error) {
      console.error("Error suspending user:", error);
      setNotice({ type: "error", text: "Could not suspend the reported user." });
    } finally {
      setBusyKey("");
    }
  };

  const keepWarning = async (report: ReportRecord) => {
    const note = getDraftNote(report.id);
    setBusyKey(`${report.id}-keep-warning`);
    setNotice(null);

    try {
      await updateDoc(doc(db, "reports", report.id), {
        status: "Warn",
        adminAction: "warning_kept",
        adminNote: note,
        decisionMessage: note,
        adminNeedsReview: false,
        updatedAt: serverTimestamp(),
        actionHistory: arrayUnion({
          actorType: "admin",
          actorName: "Admin",
          action: "keep_warning",
          status: "Warn",
          message: note,
          createdAt: Timestamp.now(),
        }),
      });

      await notifyReportedUser(report, "warn", note || "Admin reviewed your response and kept the warning on this report.", {
        openPopup: true,
      });
      setNotice({ type: "success", text: `Warning kept for ${reportedUserName(report)}.` });
      setNotes((current) => ({ ...current, [report.id]: "" }));
    } catch (error) {
      console.error("Error keeping warning:", error);
      setNotice({ type: "error", text: "Could not keep the warning." });
    } finally {
      setBusyKey("");
    }
  };

  const removeWarning = async (report: ReportRecord) => {
    const note = getDraftNote(report.id);
    setBusyKey(`${report.id}-remove-warning`);
    setNotice(null);

    try {
      await updateDoc(doc(db, "reports", report.id), {
        status: "Resolve",
        adminAction: "warning_removed",
        adminNote: note,
        decisionMessage: note,
        adminNeedsReview: false,
        updatedAt: serverTimestamp(),
        resolvedAt: serverTimestamp(),
        actionHistory: arrayUnion({
          actorType: "admin",
          actorName: "Admin",
          action: "remove_warning",
          status: "Resolve",
          message: note,
          createdAt: Timestamp.now(),
        }),
      });

      await notifyReportedUser(
        report,
        "resolve",
        note || "Admin reviewed your response and removed the warning on this report.",
        { openPopup: false },
      );
      setNotice({ type: "success", text: `Warning removed for ${reportedUserName(report)}.` });
      setNotes((current) => ({ ...current, [report.id]: "" }));
    } catch (error) {
      console.error("Error removing warning:", error);
      setNotice({ type: "error", text: "Could not remove the warning." });
    } finally {
      setBusyKey("");
    }
  };

  const rejectResponse = async (report: ReportRecord) => {
    const note = getDraftNote(report.id);
    setBusyKey(`${report.id}-reject-response`);
    setNotice(null);

    try {
      await updateDoc(doc(db, "reports", report.id), {
        status: "Reject",
        adminAction: "response_rejected",
        adminNote: note,
        decisionMessage: note,
        adminNeedsReview: false,
        updatedAt: serverTimestamp(),
        actionHistory: arrayUnion({
          actorType: "admin",
          actorName: "Admin",
          action: "reject_response",
          status: "Reject",
          message: note,
          createdAt: Timestamp.now(),
        }),
      });

      await notifyReportedUser(
        report,
        "reject",
        note || "Admin reviewed your response and rejected it.",
        { openPopup: false },
      );
      setNotice({ type: "success", text: `Response rejected for ${reportedUserName(report)}.` });
      setNotes((current) => ({ ...current, [report.id]: "" }));
    } catch (error) {
      console.error("Error rejecting response:", error);
      setNotice({ type: "error", text: "Could not reject the user response." });
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
          <div className="min-w-[1120px]">
            <div className="grid grid-cols-[0.8fr_1fr_1fr_0.9fr_1.5fr_0.8fr_0.7fr_0.5fr] border-b border-slate-200 bg-[#f6f7ff] px-4 py-4 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
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
              paginatedReports.map((report) => {
                const status = getAdminReportStatus(report);
                const evidence = Array.isArray(report.evidenceFiles) ? report.evidenceFiles : [];

                return (
                  <div
                    key={report.id}
                    className="grid grid-cols-[0.8fr_1fr_1fr_0.9fr_1.5fr_0.8fr_0.7fr_0.5fr] items-start gap-3 border-b border-slate-200 px-4 py-4 text-sm last:border-b-0"
                  >
                    <span className="pt-2 font-medium text-slate-600">{formatReportId(report.reportCode || report.id)}</span>
                    <ReportedUser
                      name={report.reporterName || "Reporter"}
                      detail={report.reporterEmail}
                      profileImageUrl={report.reporterId ? userAvatars[report.reporterId] : undefined}
                    />
                    <ReportedUser
                      name={reportedUserName(report)}
                      detail={reportedUserId(report)}
                      profileImageUrl={(() => {
                        const targetId = reportedUserId(report);
                        return targetId ? userAvatars[targetId] : undefined;
                      })()}
                    />
                    <span className="inline-flex w-fit self-start rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-500">
                      {report.issueType || report.category || "Other"}
                    </span>
                    <div className="min-w-0">
                      <p className="line-clamp-3 leading-6 text-slate-600">
                        {report.description || "No description provided."}
                      </p>
                      {evidence.length ? (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {evidence.map((file, index) => {
                            if (!file.url) {
                              return null;
                            }

                            return (
                              <button
                                type="button"
                                key={`${file.url}-${index}`}
                                onClick={() =>
                                  setPreviewFile({
                                    title: `${formatReportId(report.reportCode || report.id)} Evidence ${index + 1}`,
                                    url: file.url as string,
                                    contentType: file.type,
                                    fileName: file.name,
                                  })
                                }
                                  className="inline-flex cursor-pointer items-center rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-[#2563eb] hover:bg-blue-50"
                              >
                                Evidence {index + 1}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="mt-2 text-xs text-slate-400">No evidence attached</p>
                      )}
                    </div>
                    <span className="pt-2 whitespace-pre-line text-slate-600">{formatDate(report.createdAt)}</span>
                    <div className="pt-1">
                      <StatusPill status={status} />
                    </div>
                    <div className="flex justify-center pt-1">
                      <button
                        type="button"
                        onClick={() => setSelectedReport(report)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900"
                        aria-label={`Manage report ${formatReportId(report.reportCode || report.id)}`}
                        title="Manage report"
                      >
                        <MoreActionsIcon />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 px-4 py-4 text-sm text-slate-500">
          <p>
            Showing {paginatedReports.length} of {filteredReports.length} reports
          </p>
          <div className="flex items-center gap-2">
            <PagerButton
              label="Previous"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            />
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
              <PagerButton
                key={page}
                label={String(page)}
                active={currentPage === page}
                onClick={() => setCurrentPage(page)}
              />
            ))}
            <PagerButton
              label="Next"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            />
          </div>
        </div>
      </section>

      {selectedReport ? (
        <ReportActionModal
          report={selectedReport}
          note={notes[selectedReport.id] ?? ""}
          onNoteChange={(value) =>
            setNotes((current) => ({ ...current, [selectedReport.id]: value }))
          }
          busyKey={busyKey}
          onPreviewFile={setPreviewFile}
          onClose={() => setSelectedReport(null)}
          onWarn={async () => {
            await warnUser(selectedReport);
            setSelectedReport(null);
          }}
          onSuspend={async () => {
            await suspendUser(selectedReport);
            setSelectedReport(null);
          }}
          onResolve={async () => {
            await updateReportStatus(selectedReport, "Resolve");
            setSelectedReport(null);
          }}
          onReject={async () => {
            if (
              normalizeModerationStatus(selectedReport.status || "") === "warn" &&
              (selectedReport.reportedUserResponses || []).length > 0
            ) {
              await rejectResponse(selectedReport);
            } else {
              await updateReportStatus(selectedReport, "Reject");
            }
            setSelectedReport(null);
          }}
          onKeepWarning={async () => {
            await keepWarning(selectedReport);
            setSelectedReport(null);
          }}
          onRemoveWarning={async () => {
            await removeWarning(selectedReport);
            setSelectedReport(null);
          }}
        />
      ) : null}

      <AdminFilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
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

function ReportedUser({
  name,
  detail,
  profileImageUrl,
}: {
  name: string;
  detail?: string;
  profileImageUrl?: string;
}) {
  const letter = name[0]?.toUpperCase() ?? "?";
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-600 text-[11px] font-bold text-white">
        {profileImageUrl ? (
          <img src={profileImageUrl} alt={name} className="h-full w-full object-cover" />
        ) : (
          letter
        )}
      </span>
      <span className="min-w-0">
        <span className="block truncate font-medium text-slate-700">{name}</span>
        {detail ? <span className="block truncate text-xs text-slate-400">{detail}</span> : null}
      </span>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const normalized = normalizeModerationStatus(status);
  const styles =
    normalized === "pending"
      ? "bg-orange-100 text-orange-700"
      : normalized === "warn"
        ? "bg-blue-100 text-blue-700"
        : normalized === "suspend"
          ? "bg-rose-100 text-rose-700"
          : normalized === "resolve"
        ? "bg-teal-100 text-teal-700"
        : "bg-slate-200 text-slate-700";

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
      className={`inline-flex h-9 cursor-pointer items-center justify-center rounded-lg px-3 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${styles}`}
    >
      {busy ? "Saving..." : children}
    </button>
  );
}

function PagerButton({
  label,
  active = false,
  disabled = false,
  onClick,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-10 min-w-[42px] cursor-pointer items-center justify-center rounded-xl border px-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-45 ${
        active
          ? "border-[#2f66e7] bg-[#2f66e7] text-white shadow-sm"
          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      {label}
    </button>
  );
}

function ReportActionModal({
  report,
  note,
  onNoteChange,
  busyKey,
  onPreviewFile,
  onClose,
  onWarn,
  onSuspend,
  onResolve,
  onReject,
  onKeepWarning,
  onRemoveWarning,
}: {
  report: ReportRecord;
  note: string;
  onNoteChange: (value: string) => void;
  busyKey: string;
  onPreviewFile: (file: {
    title: string;
    url: string;
    contentType?: string;
    fileName?: string;
  } | null) => void;
  onClose: () => void;
  onWarn: () => Promise<void>;
  onSuspend: () => Promise<void>;
  onResolve: () => Promise<void>;
  onReject: () => Promise<void>;
  onKeepWarning: () => Promise<void>;
  onRemoveWarning: () => Promise<void>;
}) {
  const responseHistory = report.reportedUserResponses || [];
  const actionHistory = report.actionHistory || [];
  const reviewMode =
    normalizeModerationStatus(report.status || "") === "warn" && responseHistory.length > 0;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/40 px-4 py-6 backdrop-blur-md">
        <div className="scrollbar-none max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.22)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                Report Actions
              </p>
              <h3 className="mt-2 text-xl font-bold text-slate-900">
                {formatReportId(report.reportCode || report.id)} - {report.issueType || report.category || "Issue"}
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Reporter: {report.reporterName || "Reporter"} | Reported user: {reportedUserName(report)}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
              aria-label="Close actions popup"
            >
              <CloseIcon />
            </button>
          </div>

          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoRow label="Report ID" value={formatReportId(report.reportCode || report.id)} />
              <InfoRow label="Issue Type" value={report.issueType || report.category || "Issue"} />
              <InfoRow label="Reporter" value={report.reporterName || report.reporterEmail || "Reporter"} />
              <InfoRow label="Reported User" value={reportedUserName(report)} />
              <InfoRow label="Current Status" value={getAdminReportStatus(report)} />
              <InfoRow label="Latest Action" value={humanizeAdminAction(report.adminAction)} />
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-700">
              {report.description || "No description provided."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {(report.evidenceFiles || []).length ? (
                (report.evidenceFiles || []).map((file, index) =>
                  file.url ? (
                    <a
                      key={`${file.url}-${index}`}
                      href={file.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-[#2563eb] hover:bg-blue-50"
                    >
                      {file.name || `Evidence ${index + 1}`}
                    </a>
                  ) : null,
                )
              ) : (
                <p className="text-xs text-slate-400">No evidence attached</p>
              )}
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                User Responses
              </p>
              {responseHistory.length ? (
                <div className="mt-3 space-y-3">
                  {responseHistory
                    .slice()
                    .reverse()
                    .map((response, index) => (
                      <div
                        key={`${response.userName || "user"}-${toMillis(response.submittedAt)}-${index}`}
                        className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-800">
                            {response.userName || "Reported user"}
                          </p>
                          <span className="text-xs text-slate-500">
                            {formatDate(response.submittedAt)}
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-700">
                          {response.message || "No message provided."}
                        </p>
                        {(response.evidenceFiles || []).length ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {(response.evidenceFiles || []).map((file, fileIndex) =>
                              file.url ? (
                                <button
                                  type="button"
                                  key={`${file.url}-${fileIndex}`}
                                  onClick={() =>
                                    onPreviewFile({
                                      title: `${reportedUserName(report)} response evidence`,
                                      url: file.url || "",
                                      contentType: file.type,
                                      fileName: file.name,
                                    })
                                  }
                                  className="inline-flex rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-[#2563eb] hover:bg-blue-50"
                                >
                                  {file.name || `Response evidence ${fileIndex + 1}`}
                                </button>
                              ) : null,
                            )}
                          </div>
                        ) : null}
                      </div>
                    ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-500">No user response submitted yet.</p>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                Action History
              </p>
              {actionHistory.length ? (
                <div className="mt-3 space-y-3">
                  {actionHistory
                    .slice()
                    .reverse()
                    .map((entry, index) => (
                      <div
                        key={`${entry.action || "action"}-${toMillis(entry.createdAt)}-${index}`}
                        className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-800">
                            {humanizeAdminAction(entry.action)}
                          </p>
                          <span className="text-xs text-slate-500">
                            {formatDate(entry.createdAt)}
                          </span>
                        </div>
                        {entry.message ? (
                          <p className="mt-2 text-sm leading-6 text-slate-700">{entry.message}</p>
                        ) : null}
                      </div>
                    ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-500">No previous admin action recorded yet.</p>
              )}
            </div>
          </div>

          <div className="mt-5">
            <label className="mb-2 block text-sm font-semibold text-slate-700">Message to Reported User</label>
            <textarea
              value={note}
              onChange={(event) => onNoteChange(event.target.value)}
              placeholder="Explain the warning, suspension, rejection, or resolution decision..."
              className="h-28 w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2f66e7] focus:ring-4 focus:ring-blue-100"
            />
          </div>

          {reviewMode ? (
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <ActionButton
                busy={busyKey === `${report.id}-keep-warning`}
                disabled={busyKey !== ""}
                onClick={() => void onKeepWarning()}
              >
                Keep Warning
              </ActionButton>
              <ActionButton
                tone="muted"
                busy={busyKey === `${report.id}-remove-warning`}
                disabled={busyKey !== ""}
                onClick={() => void onRemoveWarning()}
              >
                Remove Warning
              </ActionButton>
              <ActionButton
                tone="danger"
                busy={busyKey === `${report.id}-suspend`}
                disabled={busyKey !== ""}
                onClick={() => void onSuspend()}
              >
                Suspend User
              </ActionButton>
              <ActionButton
                tone="muted"
                busy={busyKey === `${report.id}-Reject`}
                disabled={busyKey !== ""}
                onClick={() => void onReject()}
              >
                Reject Response
              </ActionButton>
              <ActionButton
                tone="success"
                busy={busyKey === `${report.id}-Resolve`}
                disabled={busyKey !== ""}
                onClick={() => void onResolve()}
              >
                Resolve & Close
              </ActionButton>
            </div>
          ) : (
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <ActionButton
                busy={busyKey === `${report.id}-warn`}
                disabled={busyKey !== ""}
                onClick={() => void onWarn()}
              >
                Warn User
              </ActionButton>
              <ActionButton
                tone="danger"
                busy={busyKey === `${report.id}-suspend`}
                disabled={busyKey !== ""}
                onClick={() => void onSuspend()}
              >
                Suspend Account
              </ActionButton>
              <ActionButton
                tone="success"
                busy={busyKey === `${report.id}-Resolve`}
                disabled={busyKey !== ""}
                onClick={() => void onResolve()}
              >
                Resolve Report
              </ActionButton>
              <ActionButton
                tone="muted"
                busy={busyKey === `${report.id}-Reject`}
                disabled={busyKey !== ""}
                onClick={() => void onReject()}
              >
                Reject Report
              </ActionButton>
            </div>
          )}
        </div>
      </div>
    </ModalPortal>
  );
}

function reportedUserId(report: ReportRecord) {
  return report.targetUserId || report.reportedUserId || report.reportedUser || "";
}

function reportedUserName(report: ReportRecord) {
  return report.targetUserName || report.reportedUserName || report.reportedUser || "Reported user";
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

async function notifyReportedUser(
  report: ReportRecord,
  action: ModerationAction,
  decisionMessage: string,
  options?: {
    openPopup?: boolean;
  },
) {
  const targetUserId = reportedUserId(report);
  if (!targetUserId) {
    return;
  }

  const reportReference = formatReportId(report.reportCode || report.id);
  const actionLabel = moderationActionLabel(action);
  const summary = decisionMessage.trim() || `${actionLabel} applied by admin after reviewing this report.`;
  const reportedUserTitle =
    action === "warn"
      ? `${reportReference} - Warning issued by admin`
      : `${reportReference} - Admin action: ${actionLabel}`;
  const reportedUserDescription =
    `A report has been filed against your account. Report ID: ${reportReference}. ` +
    `Admin action: ${actionLabel}. ${summary}`;

  await createNotification({
    userId: targetUserId,
    title: reportedUserTitle,
    description: reportedUserDescription,
    type: "system",
    icon: action === "resolve" ? "check-circle" : action === "reject" ? "x-circle" : "alert-triangle",
    tone: action === "resolve" ? "emerald" : action === "reject" ? "red" : "red",
    href: notificationHrefForRole(report.targetUserRole),
    destination: notificationHrefForRole(report.targetUserRole),
    metadata: {
      kind: "report_action",
      reportId: report.id,
      action,
      decisionMessage: summary,
      contactEmail: ADMIN_CONTACT_EMAIL,
      openPopup: options?.openPopup ?? action === "warn",
    },
  });

  if (report.reporterId) {
    await createNotification({
      userId: report.reporterId,
      title: `${reportReference} - Admin update`,
      description: `Admin has taken action on your report. Report ID: ${reportReference}. Action: ${actionLabel}.`,
      type: "system",
      icon: action === "resolve" ? "check-circle" : "alert-triangle",
      tone: action === "resolve" ? "emerald" : "blue",
      href: notificationHrefForRole(report.reporterRole),
      destination: notificationHrefForRole(report.reporterRole),
    });
  }

  const targetUserDoc = await getDoc(doc(db, "users", targetUserId));
  const targetUserData = targetUserDoc.exists()
    ? (targetUserDoc.data() as { email?: string; name?: string })
    : null;
  const targetUserEmail =
    typeof targetUserData?.email === "string" ? targetUserData.email.trim() : "";

  if (targetUserEmail) {
    await queueEmail({
      to: targetUserEmail,
      subject: `${reportReference} report action update`,
      text: [
        `Hi ${reportedUserName(report) || targetUserData?.name || "there"},`,
        "",
        `A report has been filed against your account.`,
        `Report ID: ${reportReference}`,
        `Admin action: ${actionLabel}`,
        summary,
        "",
        `If you need help, contact admin: ${ADMIN_CONTACT_EMAIL}`,
      ].join("\n"),
      html: `<div style="font-family: Arial, sans-serif; line-height:1.6; color:#0f172a;">
        <h2 style="color:#1d4ed8;">${reportReference} report action update</h2>
        <p>A report has been filed against your account.</p>
        <p><strong>Report ID:</strong> ${reportReference}</p>
        <p><strong>Admin action:</strong> ${actionLabel}</p>
        <p>${escapeHtml(summary)}</p>
        <p>If you need help, contact admin: <a href="mailto:${ADMIN_CONTACT_EMAIL}">${ADMIN_CONTACT_EMAIL}</a></p>
      </div>`,
      metadata: {
        type: "report_admin_update",
        reportId: report.id,
      },
    });
  }
}

function humanizeAdminAction(action?: string) {
  if (!action) return "No action recorded";

  const labels: Record<string, string> = {
    warning_sent: "Warning Sent",
    warning_kept: "Keep Warning",
    warning_removed: "Remove Warning",
    account_suspended: "Suspend User",
    response_rejected: "Reject Response",
    report_resolved: "Resolve & Close",
    report_rejected: "Reject Report",
    resolve_and_close: "Resolve & Close",
    reject_response: "Reject Response",
    warn: "Warn User",
    suspend: "Suspend User",
    keep_warning: "Keep Warning",
    remove_warning: "Remove Warning",
  };

  return labels[action] || action.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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

function MoreActionsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
      <circle cx="5" cy="12" r="1" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
