"use client";

import { useEffect, useMemo, useState } from "react";
import { Timestamp, arrayUnion, collection, doc, getDoc, getDocs, query, serverTimestamp, updateDoc, where } from "firebase/firestore";

import ModalPortal from "@/components/ui/modal-portal";
import { db } from "@/lib/firebase";
import { createNotification } from "@/lib/notifications";
import {
  ADMIN_CONTACT_EMAIL,
  MODERATION_EVIDENCE_ACCEPT,
  formatReportId,
  moderationActionLabel,
  normalizeModerationStatus,
  type ModerationAction,
  type ModerationEvidenceFile,
  isAllowedModerationEvidenceFile,
  uploadModerationEvidence,
} from "@/lib/moderation";

type ReportActionModalProps = {
  open: boolean;
  reportId: string;
  action: ModerationAction;
  decisionMessage?: string;
  onClose: () => void;
  userId: string;
  userName?: string;
};

type ReportRecord = {
  reportCode?: string;
  adminNote?: string;
  status?: string;
  targetUserId?: string;
  reportedUserId?: string;
  reportedUser?: string;
  reportedUserResponses?: Array<{
    userId?: string;
    message?: string;
    evidenceFiles?: ModerationEvidenceFile[];
    userName?: string;
    submittedAt?: Timestamp;
  }>;
};

export default function ReportActionModal({
  open,
  reportId,
  action,
  decisionMessage,
  onClose,
  userId,
  userName,
}: ReportActionModalProps) {
  const [report, setReport] = useState<ReportRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [fileError, setFileError] = useState("");

  useEffect(() => {
    if (!open) return;

    let active = true;
    setLoading(true);
    setNotice("");

    void getDoc(doc(db, "reports", reportId))
      .then((snapshot) => {
        if (!active) return;
        setReport(snapshot.exists() ? (snapshot.data() as ReportRecord) : null);
      })
      .catch((error) => {
        console.error("Error loading report action modal:", error);
        if (active) {
          setReport(null);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [open, reportId]);

  const latestResponse = useMemo(() => {
    const responses = report?.reportedUserResponses || [];
    return responses.length ? responses[responses.length - 1] : null;
  }, [report?.reportedUserResponses]);

  const canReplyToReport =
    report?.targetUserId === userId ||
    report?.reportedUserId === userId ||
    report?.reportedUser === userId;
  const expectedReplyUserId =
    report?.targetUserId || report?.reportedUserId || report?.reportedUser || "";

  if (!open) return null;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const incoming = event.target.files?.[0] || null;
    event.target.value = "";

    if (!incoming) {
      return;
    }

    if (!isAllowedModerationEvidenceFile(incoming)) {
      setSelectedFile(null);
      setFileError("Only one JPG, PNG, DOC, or DOCX file up to 1MB can be uploaded.");
      return;
    }

    setSelectedFile(incoming);
    setFileError("");
    setNotice("");
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFileError("");
  };

  const handleSubmit = async () => {
    if (!canReplyToReport) {
      setNotice(
        expectedReplyUserId
          ? `Only the reported user can submit a reply to this report. Current user: ${userId}. Expected reported user: ${expectedReplyUserId}.`
          : "Only the reported user can submit a reply to this report. This report is missing the expected target user ID.",
      );
      return;
    }

    if (!replyMessage.trim() && !selectedFile) {
      setNotice(
        "Your reply is required. Add a clarification message or attach one supporting file.",
      );
      return;
    }

    setBusy(true);
    setNotice("");

    try {
      let evidenceFiles: ModerationEvidenceFile[] = [];

      if (selectedFile) {
        try {
          evidenceFiles = [await uploadModerationEvidence(userId, selectedFile)];
        } catch (error) {
          console.error("Error uploading moderation evidence:", error);
          setNotice(
            error instanceof Error
              ? error.message
              : "Could not upload the supporting file. Please try again.",
          );
          return;
        }
      }

      try {
        const nextStatus =
          normalizeModerationStatus(report?.status || "") === "warn"
            ? "Pending"
            : report?.status || "Pending";

        await updateDoc(doc(db, "reports", reportId), {
          reportedUserResponses: arrayUnion({
            userId,
            userName: userName || "Reported user",
            message: replyMessage.trim(),
            evidenceFiles,
            submittedAt: Timestamp.now(),
          }),
          status: nextStatus,
          adminNeedsReview: true,
          lastResponseAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        console.error("Error updating report reply:", error);
        setNotice(
          expectedReplyUserId
            ? `Reply permission failed for this report. Current user: ${userId}. Expected reported user: ${expectedReplyUserId}.`
            : "Reply permission failed because this report does not contain the required reported-user ID fields.",
        );
        return;
      }

      try {
        const adminSnapshot = await getDocs(
          query(collection(db, "users"), where("role", "==", "admin")),
        );

        await Promise.all(
          adminSnapshot.docs.map((adminDoc) =>
            createNotification({
              userId: adminDoc.id,
              title: `${formatReportId(report?.reportCode || reportId)} - User response received`,
              description:
                `${userName || "The reported user"} submitted a response to this report. ` +
                "Review the new explanation and evidence in Report Handling.",
              type: "system",
              icon: "alert-triangle",
              tone: "blue",
              href: "/admin/issue-resolution",
              destination: "/admin/issue-resolution",
              metadata: {
                kind: "report_response",
                reportId,
              },
            }),
          ),
        );
      } catch {
        // A saved user response matters more than the follow-up admin notification.
      }

      setReplyMessage("");
      setSelectedFile(null);
      setFileError("");
      setNotice("Your response and supporting evidence were submitted to admin.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/40 px-4 py-8 backdrop-blur-md">
        <div className="scrollbar-none max-h-[88vh] w-full max-w-[920px] overflow-y-auto rounded-[30px] border border-white/70 bg-white px-5 py-6 shadow-[0_28px_70px_rgba(15,23,42,0.18)] sm:px-7 sm:py-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1454cc]">
                Report Action
              </p>
              <h3 className="mt-2 text-2xl font-semibold text-slate-900">
                {formatReportId(report?.reportCode || reportId)}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
              aria-label="Close report popup"
            >
              <CloseIcon />
            </button>
          </div>

          {loading ? (
            <div className="mt-6 text-sm text-slate-500">Loading report details...</div>
          ) : (
            <>
              <div className="mt-6 grid items-stretch gap-5 lg:grid-cols-[0.98fr_1.02fr]">
                <div className="flex h-full flex-col gap-4">
                  <section className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                      Admin Update
                    </p>
                    <div className="mt-3 space-y-3">
                      <InfoLine
                        label="Report ID"
                        value={formatReportId(report?.reportCode || reportId)}
                      />
                      <InfoLine
                        label="Admin action"
                        value={moderationActionLabel(action)}
                      />
                    </div>
                  </section>

                  <section className="rounded-2xl border border-slate-200 bg-white p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                      Admin Message
                    </p>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {decisionMessage?.trim() ||
                        report?.adminNote?.trim() ||
                        "Admin reviewed an issue related to your account and recorded this action."}
                    </p>
                  </section>

                  <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                      Need Help?
                    </p>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      Contact the admin team for clarification or to appeal this action.
                    </p>
                    <a
                      href={`mailto:${ADMIN_CONTACT_EMAIL}?subject=${encodeURIComponent(`Appeal for ${formatReportId(report?.reportCode || reportId)}`)}`}
                      className="mt-4 inline-flex h-11 items-center justify-center rounded-xl bg-[#2f66e7] px-5 text-sm font-semibold text-white transition hover:bg-[#2557cf]"
                    >
                      Email Admin
                    </a>
                  </section>
                </div>

                <div className="flex h-full">
                  <section className="flex h-full w-full flex-col rounded-2xl border border-slate-200 bg-[#f7f9ff] p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                      Your Reply
                    </p>
                    {canReplyToReport ? (
                      <>
                        <p className="mt-2 text-sm leading-6 text-slate-500">
                          Add your clarification and, if needed, attach one supporting file for admin review.
                        </p>
                        <textarea
                          value={replyMessage}
                          onChange={(event) => {
                            setReplyMessage(event.target.value);
                            if (notice) {
                              setNotice("");
                            }
                          }}
                          placeholder="Add clarification, explain your side, or attach supporting details for admin review."
                          className="mt-4 min-h-32 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2f66e7] focus:ring-4 focus:ring-blue-100"
                        />
                        <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="text-sm font-semibold text-slate-700">Supporting File</p>
                              <p className="mt-1 text-xs text-slate-500">
                                Upload only 1 file. Allowed: JPG, PNG, DOC, DOCX. Max size: 1MB.
                              </p>
                            </div>
                            <label className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl bg-[#1454cc] px-5 text-sm font-semibold text-white transition hover:bg-[#1146ab] whitespace-nowrap text-center">
                              Choose File
                              <input
                                type="file"
                                accept={MODERATION_EVIDENCE_ACCEPT}
                                onChange={handleFileChange}
                                className="sr-only"
                              />
                            </label>
                          </div>

                          {selectedFile ? (
                            <div className="mt-4 flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-slate-700">
                                  {selectedFile.name}
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                  {(selectedFile.size / 1024).toFixed(0)} KB
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={handleRemoveFile}
                                className="ml-3 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                                aria-label="Remove selected file"
                                title="Remove file"
                              >
                                <CloseIcon />
                              </button>
                            </div>
                          ) : (
                            <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
                              No file selected yet.
                            </div>
                          )}
                          {fileError ? (
                            <p className="mt-3 text-xs font-medium text-red-500">
                              {fileError}
                            </p>
                          ) : null}
                        </div>
                      </>
                    ) : (
                      <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
                        {expectedReplyUserId
                          ? `Only the reported user can reply here. Current user: ${userId}. Expected reported user: ${expectedReplyUserId}.`
                          : "This report is missing the expected reported-user ID, so reply access cannot be confirmed."}
                      </div>
                    )}
                    {latestResponse?.message || (latestResponse?.evidenceFiles || []).length ? (
                      <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-xs text-emerald-800">
                        <p className="font-bold">Latest reply on file</p>
                        {latestResponse?.message ? (
                          <p className="mt-1 leading-5">{latestResponse.message}</p>
                        ) : null}
                        {(latestResponse?.evidenceFiles || []).length ? (
                          <p className="mt-2">
                            {(latestResponse?.evidenceFiles || []).length} evidence attachment
                            {(latestResponse?.evidenceFiles || []).length === 1 ? "" : "s"} already submitted.
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </section>
                </div>
              </div>
            </>
          )}

          {notice ? (
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              {notice}
            </div>
          ) : null}

          <div className="mt-6 flex flex-col-reverse justify-center gap-3 border-t border-slate-100 pt-6 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 min-w-[120px] items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={busy || !canReplyToReport}
              className="inline-flex h-11 min-w-[190px] items-center justify-center rounded-xl bg-[#1454cc] px-5 text-sm font-semibold text-white transition hover:bg-[#1146ab] disabled:opacity-60"
            >
              {busy ? "Submitting..." : "Submit Response"}
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
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

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
}
