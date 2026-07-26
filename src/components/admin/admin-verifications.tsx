"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  collection,
  addDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { getDownloadURL, ref } from "firebase/storage";
import { auth, db, storage } from "@/lib/firebase";
import { createNotification } from "@/lib/notifications";
import type { ProviderVerificationStatus, StudentProofType } from "@/lib/platform";
import AdminFilePreviewModal from "@/components/admin/admin-file-preview-modal";
import SelectField from "@/components/ui/select-field";

type VerificationStatus = Exclude<ProviderVerificationStatus, "not_required">;

type VerificationRow = {
  id: string;
  userId: string;
  studentName: string;
  email: string;
  university: string;
  degree: string;
  yearOfStudy: string;
  proof?: {
    fileName?: string;
    fileType?: StudentProofType;
    downloadUrl?: string;
    contentType?: string;
    storagePath?: string;
  };
  status: VerificationStatus;
  adminNote?: string;
  studentMessage?: string;
  resubmissionMessage?: string;
  submittedAt?: { toDate?: () => Date } | Date | string | number | null;
  resubmittedAt?: { toDate?: () => Date } | Date | string | number | null;
};

type UserAvatarMap = Record<string, string>;

type StatItem = {
  label: string;
  value: string;
  tone: "teal" | "blue" | "peach" | "rose";
};
const VERIFICATIONS_PER_PAGE = 6;
const verificationFilters = ["All Statuses", "Pending", "Approved", "Rejected"];

export default function AdminVerifications() {
  const [rows, setRows] = useState<VerificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [downloadUrls, setDownloadUrls] = useState<Record<string, string>>({});
  const [userAvatars, setUserAvatars] = useState<UserAvatarMap>({});
  const [statusFilter, setStatusFilter] = useState(verificationFilters[0]);
  const [currentPage, setCurrentPage] = useState(1);
  const [reviewRow, setReviewRow] = useState<VerificationRow | null>(null);
  const [previewFile, setPreviewFile] = useState<{
    title: string;
    url: string;
    contentType?: string;
    fileName?: string;
  } | null>(null);

  useEffect(() => {
    const verificationsQuery = query(
      collection(db, "providerVerifications"),
      orderBy("submittedAt", "desc"),
    );

    const unsubscribe = onSnapshot(
      verificationsQuery,
      (snapshot) => {
        const nextRows = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as VerificationRow[];

        setRows(nextRows);
        setNotes((current) => {
          const nextNotes = { ...current };
          nextRows.forEach((row) => {
            if (nextNotes[row.id] === undefined) {
              nextNotes[row.id] = row.adminNote || "";
            }
          });
          return nextNotes;
        });
        setLoading(false);
      },
      (err) => {
        console.error("Error loading provider verifications:", err);
        setError("Could not load verification requests. Check admin permissions.");
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

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

  const stats = useMemo<StatItem[]>(() => {
    const pending = rows.filter((row) => row.status === "pending").length;
    const approved = rows.filter((row) => row.status === "approved").length;
    const rejected = rows.filter((row) => row.status === "rejected").length;

    return [
      { label: "Total Requests", value: String(rows.length), tone: "teal" },
      { label: "Pending Verification", value: String(pending), tone: "blue" },
      { label: "Approved Providers", value: String(approved), tone: "peach" },
      { label: "Rejected Verifications", value: String(rejected), tone: "rose" },
    ];
  }, [rows]);
  const filteredRows = useMemo(() => {
    if (statusFilter === "All Statuses") {
      return rows;
    }

    return rows.filter((row) => row.status === statusFilter.toLowerCase());
  }, [rows, statusFilter]);
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / VERIFICATIONS_PER_PAGE));
  const paginatedRows = filteredRows.slice(
    (currentPage - 1) * VERIFICATIONS_PER_PAGE,
    currentPage * VERIFICATIONS_PER_PAGE,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const openProofPreview = async (row: VerificationRow) => {
    const existingUrl = downloadUrls[row.id] || row.proof?.downloadUrl;
    const storagePath = row.proof?.storagePath;

    try {
      let url = existingUrl || "";

      if (!url && storagePath) {
        const currentUser = auth.currentUser;

        if (!currentUser) {
          setError("Please log in to the admin panel again before opening proof files.");
          return;
        }

        // Refresh the auth token before Storage checks custom Firestore admin access.
        await currentUser.getIdToken(true);
        url = await getDownloadURL(ref(storage, storagePath));
      }

      if (!url) {
        setError("Could not find the uploaded proof file.");
        return;
      }

      if (!existingUrl) {
        setDownloadUrls((current) => ({ ...current, [row.id]: url }));
      }

      setPreviewFile({
        title: `${row.studentName} Proof`,
        url,
        contentType: row.proof?.contentType,
        fileName: row.proof?.fileName,
      });
    } catch (err) {
      console.error("Error opening proof preview:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Could not open the uploaded proof file.",
      );
    }
  };

  const handleReview = async (row: VerificationRow, status: "approved" | "rejected") => {
    const adminNote = notes[row.id]?.trim() || "";
    setBusyId(row.id);
    setError("");
    let approvalEmailQueued = false;

    try {
      const verificationRef = doc(db, "providerVerifications", row.id);
      const userRef = doc(db, "users", row.userId);

      await updateDoc(verificationRef, {
        status,
        adminNote,
        reviewedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      if (status === "approved") {
        await updateDoc(userRef, {
          role: "provider",
          accountStatus: "active",
          providerVerificationStatus: "approved",
          canBuyServices: false,
          canSellServices: true,
          verifiedStudentProvider: true,
          adminNote,
          providerApprovedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        await setDoc(
          doc(db, "providerProfiles", row.userId),
          {
            providerId: row.userId,
            userId: row.userId,
            verificationId: row.id,
            university: row.university,
            degreeName: row.degree,
            yearOfStudy: row.yearOfStudy,
            providerBio: "",
            providerStatus: "approved",
            averageRating: 0,
            totalReviews: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        );

        await createNotification({
          userId: row.userId,
          title: "Provider Verification Approved",
          description: "Your student proof was approved. You can now create service gigs.",
          type: "system",
          icon: "OK",
          tone: "emerald",
          href: "/dashboard/provider",
        });

        await queueProviderApprovalEmail(row);
        approvalEmailQueued = true;
      } else {
        await updateDoc(userRef, {
          role: "buyer",
          accountStatus: "suspended",
          providerVerificationStatus: "rejected",
          canBuyServices: false,
          canSellServices: false,
          verifiedStudentProvider: false,
          adminNote,
          updatedAt: serverTimestamp(),
        });

        await createNotification({
          userId: row.userId,
          title: "Provider Verification Rejected",
          description: adminNote || "Your student proof could not be approved. Please contact support.",
          type: "system",
          icon: "!",
          tone: "red",
          href: "/help",
        });
      }

      await addDoc(collection(db, "adminActions"), {
        targetUserId: row.userId,
        targetRole: "provider",
        verificationId: row.id,
        actionType: status === "approved" ? "approve_provider" : "reject_provider",
        actionNote: adminNote,
        approvalEmailQueued,
        createdAt: serverTimestamp(),
      });
      setReviewRow(null);
    } catch (err) {
      console.error("Error reviewing verification:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Could not update verification or queue the success email.",
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="px-6 py-10">
      <section className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-[30px] font-semibold leading-tight tracking-tight text-slate-900">
            Student Provider Verifications
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Review uploaded student proof documents and approve verified students as service providers.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-[220px_auto] xl:items-end">
          <div className="min-w-0">
            <SelectField
              label="Verification Status"
              value={statusFilter}
              onChange={setStatusFilter}
              options={verificationFilters}
              title="Filter verification requests"
              wrapperClassName="min-w-0"
              labelClassName="mb-0 text-sm font-medium text-slate-600"
              className="h-12 rounded-xl border-slate-200 px-4 text-sm font-medium text-slate-700 shadow-sm"
            />
          </div>
          <button
            type="button"
            onClick={() => setStatusFilter(verificationFilters[0])}
            className="inline-flex h-12 w-12 cursor-pointer items-center justify-center self-end rounded-xl border border-slate-200 bg-slate-50 text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
            aria-label="Clear verification filters"
            title="Clear filters"
          >
            <FilterResetIcon />
          </button>
        </div>
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} stat={stat} />
        ))}
      </section>

      {error ? (
        <p className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </p>
      ) : null}

      <section className="mt-8 overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-[0_6px_18px_rgba(15,23,42,0.05)]">
        <div className="grid grid-cols-[minmax(0,1.45fr)_minmax(0,1.2fr)_minmax(0,1.05fr)_minmax(0,1fr)_minmax(0,0.9fr)_minmax(90px,0.45fr)] gap-6 border-b border-slate-300 bg-[#f0f1ff] px-6 py-5 text-[12px] font-medium text-slate-700">
          <span className="min-w-0">Student</span>
          <span className="min-w-0">University</span>
          <span className="min-w-0">Programme</span>
          <span className="min-w-0">Proof Type</span>
          <span className="min-w-0">Status</span>
          <span className="min-w-0">Actions</span>
        </div>

        {loading ? (
          <div className="flex h-56 items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#2b62e6] border-t-transparent" />
          </div>
        ) : filteredRows.length ? (
          paginatedRows.map((row, index) => (
            <div
              key={row.id}
              className="grid grid-cols-[minmax(0,1.45fr)_minmax(0,1.2fr)_minmax(0,1.05fr)_minmax(0,1fr)_minmax(0,0.9fr)_minmax(90px,0.45fr)] items-start gap-6 border-b border-slate-300 px-6 py-4 last:border-b-0"
            >
              <div className="flex min-w-0 items-center gap-3">
                <Avatar
                  name={row.studentName}
                  index={(currentPage - 1) * VERIFICATIONS_PER_PAGE + index}
                  profileImageUrl={userAvatars[row.userId]}
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">{row.studentName}</p>
                  <p className="truncate text-xs text-slate-500">{row.email}</p>
                  <p className="mt-0.5 text-[11px] text-slate-400">{formatDate(row.submittedAt)}</p>
                </div>
              </div>
              <div className="min-w-0 pt-1 text-sm text-slate-700">
                <span className="block truncate">{row.university}</span>
              </div>
              <div className="min-w-0 pt-1 text-sm text-slate-700">
                {row.degree}
                <span className="mt-1 block text-xs text-slate-400">{row.yearOfStudy}</span>
              </div>
              <div className="min-w-0 pt-1 text-sm text-slate-700">
                {row.proof?.fileType || "Student ID"}
                {(downloadUrls[row.id] || row.proof?.downloadUrl || row.proof?.storagePath) ? (
                  <button
                    type="button"
                    onClick={() => void openProofPreview(row)}
                      className="mt-1 block cursor-pointer text-xs font-semibold text-[#1454cc]"
                  >
                    View File
                  </button>
                ) : null}
              </div>
              <div className="pt-1">
                <StatusPill status={row.status} />
              </div>
              <div className="flex min-w-0 justify-start pt-0.5">
                <button
                  type="button"
                  onClick={() => setReviewRow(row)}
                  className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white text-[#1454cc] shadow-sm transition hover:border-[#2b62e6] hover:bg-blue-50"
                  aria-label={`Review ${row.studentName}'s verification`}
                  title="Open review popup"
                >
                  <ReviewActionIcon />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="px-6 py-16 text-center text-sm text-slate-500">
            No student provider verification requests yet.
          </div>
        )}

        <div className="flex flex-col gap-4 px-4 py-4 text-sm text-slate-700 sm:flex-row sm:items-center sm:justify-between">
          <p className="px-2">
            Showing {paginatedRows.length} of {filteredRows.length} verification request{filteredRows.length === 1 ? "" : "s"}
          </p>
          <div className="flex items-center gap-2">
            <PagerButton
              label="Previous"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            />
            {Array.from({ length: totalPages }, (_, pageIndex) => pageIndex + 1).map((page) => (
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

      <AdminFilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
      {reviewRow ? (
        <VerificationReviewModal
          row={reviewRow}
          adminNote={notes[reviewRow.id] || ""}
          busy={busyId === reviewRow.id}
          hasProof={Boolean(
            downloadUrls[reviewRow.id] ||
              reviewRow.proof?.downloadUrl ||
              reviewRow.proof?.storagePath,
          )}
          onClose={() => setReviewRow(null)}
          onAdminNoteChange={(value) =>
            setNotes((current) => ({ ...current, [reviewRow.id]: value }))
          }
          onPreview={() => void openProofPreview(reviewRow)}
          onReview={(status) => handleReview(reviewRow, status)}
        />
      ) : null}
    </div>
  );
}

function VerificationReviewModal({
  row,
  adminNote,
  busy,
  hasProof,
  onClose,
  onAdminNoteChange,
  onPreview,
  onReview,
}: {
  row: VerificationRow;
  adminNote: string;
  busy: boolean;
  hasProof: boolean;
  onClose: () => void;
  onAdminNoteChange: (value: string) => void;
  onPreview: () => void;
  onReview: (status: "approved" | "rejected") => void;
}) {
  const studentMessage = row.resubmissionMessage?.trim() || row.studentMessage?.trim();
  const previousAdminNote = row.adminNote?.trim();
  const modalRef = useRef<HTMLDivElement | null>(null);
  const [needsScroll, setNeedsScroll] = useState(false);

  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) return;

    const updateScrollState = () => {
      setNeedsScroll(modal.scrollHeight > modal.clientHeight + 2);
    };

    updateScrollState();
    window.addEventListener("resize", updateScrollState);

    return () => window.removeEventListener("resize", updateScrollState);
  }, [adminNote, previousAdminNote, studentMessage, row.id]);

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/35 px-4 py-2 backdrop-blur-md sm:py-3"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className={`relative max-h-[calc(100dvh-1rem)] w-full max-w-xl overflow-x-hidden overscroll-contain rounded-3xl border border-white/70 bg-white/95 p-4 text-slate-900 shadow-[0_24px_80px_rgba(15,23,42,0.25)] sm:max-h-[calc(100dvh-1.5rem)] sm:p-5 ${
          needsScroll ? "overflow-y-auto" : "overflow-y-hidden"
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-blue-100/80 blur-3xl" aria-hidden="true" />
        <div className="absolute -bottom-24 -left-20 h-56 w-56 rounded-full bg-emerald-100/80 blur-3xl" aria-hidden="true" />
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 z-10 inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
          aria-label="Close verification review popup"
        >
          <CloseSmallIcon />
        </button>

        <div className="relative">
          <div className="flex flex-col gap-3 pr-10 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#1454cc]">
                Verification review
              </p>
              <h3 className="mt-1.5 truncate text-2xl font-semibold text-slate-950">
                {row.studentName}
              </h3>
              <p className="mt-1 truncate text-sm text-slate-500">{row.email}</p>
            </div>
            <div className="shrink-0">
              <StatusPill status={row.status} />
            </div>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <InfoTile label="University" value={row.university || "Not provided"} />
            <InfoTile label="Programme" value={`${row.degree || "Not provided"} - ${row.yearOfStudy || "Year not provided"}`} />
            <InfoTile label="Proof Type" value={row.proof?.fileType || "Student ID"} />
            <InfoTile
              label={row.resubmittedAt ? "Resubmitted" : "Submitted"}
              value={formatDate(row.resubmittedAt || row.submittedAt)}
            />
          </div>

          {studentMessage ? (
            <div className="mt-3 rounded-2xl border border-blue-100 bg-blue-50/80 p-3">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1454cc]">
                Student request
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-700">{studentMessage}</p>
            </div>
          ) : null}

          {previousAdminNote ? (
            <div className="mt-3 rounded-2xl border border-red-100 bg-red-50/80 p-3">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-600">
                Previous admin note
              </p>
              <p className="mt-2 text-sm leading-6 text-red-900">{previousAdminNote}</p>
            </div>
          ) : null}

          <div className="mt-3 rounded-2xl border border-slate-200 bg-white/80 p-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">Uploaded proof</p>
                <p className="mt-1 truncate text-xs text-slate-500">
                  {row.proof?.fileName || "Proof document"}
                </p>
              </div>
              <button
                type="button"
                onClick={onPreview}
                disabled={!hasProof}
                className="inline-flex h-10 cursor-pointer items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                View Proof
              </button>
            </div>
          </div>

          <label className="mt-3 block text-sm font-semibold text-slate-700">
            Admin note
            <textarea
              value={adminNote}
              onChange={(event) => onAdminNoteChange(event.target.value)}
              placeholder="Tell the student what was checked, or why the proof is rejected."
              className="mt-2 min-h-20 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-normal text-slate-700 outline-none transition focus:border-[#2b62e6] focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => onReview("approved")}
              disabled={busy}
              className="inline-flex h-12 cursor-pointer items-center justify-center rounded-xl bg-[#2f66e7] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#2457cc] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? "Updating..." : "Approve"}
            </button>
            <button
              type="button"
              onClick={() => onReview("rejected")}
              disabled={busy}
              className="inline-flex h-12 cursor-pointer items-center justify-center rounded-xl border border-red-200 bg-red-50 px-5 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? "Updating..." : "Reject"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
}

function formatDate(value: VerificationRow["submittedAt"]) {
  if (!value) return "Submitted recently";
  const date =
    typeof value === "object" && "toDate" in value && typeof value.toDate === "function"
      ? value.toDate()
      : new Date(value as Date | string | number);

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

async function queueProviderApprovalEmail(row: VerificationRow) {
  const recipientEmail = row.email?.trim();
  if (!recipientEmail) return;

  const studentName = row.studentName?.trim() || "there";
  const subject = "Verification successful - welcome to Skill Swap Hub";
  const text = [
    `Hi ${studentName},`,
    "",
    "Good news! Your student verification has been approved by the admin.",
    "Your Skill Swap Hub account is now verified. You can sign in, access your provider dashboard, create service gigs, and start using the system.",
    "",
    "Welcome to Skill Swap Hub, and thank you for joining our trusted student service community.",
    "",
    "Open Skill Swap Hub and continue to your verified account:",
    "http://localhost:3000/login",
    "",
    "Skill Swap Hub",
  ].join("\n");

  await addDoc(collection(db, "mail"), {
    to: [recipientEmail],
    message: {
      subject,
      text,
      html: `
        <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6; max-width: 560px;">
          <div style="padding: 24px; border: 1px solid #dbeafe; border-radius: 18px; background: linear-gradient(135deg, #eff6ff 0%, #ecfdf5 100%);">
            <p style="margin: 0 0 10px; color: #0f766e; font-size: 12px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase;">Verification Successful</p>
            <h2 style="color: #0f4cbf; margin: 0 0 12px;">Your account is verified</h2>
            <p>Hi ${escapeHtml(studentName)},</p>
            <p>Good news! Your student verification has been approved by the admin.</p>
            <p>Your Skill Swap Hub account is now verified. You can sign in, access your provider dashboard, create service gigs, and start using the system.</p>
            <p style="margin: 18px 0 0;">Welcome to Skill Swap Hub, and thank you for joining our trusted student service community.</p>
            <a href="http://localhost:3000/login" style="display: inline-block; margin-top: 20px; padding: 11px 18px; border-radius: 12px; background: #2b62e6; color: #ffffff; font-weight: 700; text-decoration: none;">Open Skill Swap Hub</a>
          </div>
          <p style="margin-top: 18px; color: #64748b; font-size: 12px;">Skill Swap Hub</p>
        </div>
      `,
    },
    metadata: {
      type: "student_verification_success",
      userId: row.userId,
      verificationId: row.id,
    },
    createdAt: serverTimestamp(),
  });
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function StatCard({ stat }: { stat: StatItem }) {
  const toneClasses =
    stat.tone === "teal"
      ? {
          accent: "bg-[#66ead9] text-[#006d63]",
          wash: "bg-[#d9faf3]",
          hover: "hover:border-teal-300 hover:bg-teal-50/40",
        }
      : stat.tone === "blue"
        ? {
            accent: "bg-[#dfe5ff] text-[#21367d]",
            wash: "bg-[#e5ecff]",
            hover: "hover:border-blue-300 hover:bg-blue-50/40",
          }
        : stat.tone === "peach"
          ? {
              accent: "bg-[#ffdccc] text-[#9a4a1f]",
              wash: "bg-[#faeadf]",
              hover: "hover:border-orange-300 hover:bg-orange-50/40",
            }
          : {
              accent: "bg-[#ffd8d8] text-[#b91c1c]",
              wash: "bg-[#fbe9e9]",
              hover: "hover:border-rose-300 hover:bg-rose-50/40",
            };

  return (
    <article className={`relative overflow-hidden rounded-2xl border border-slate-300 bg-white p-5 shadow-[0_6px_18px_rgba(15,23,42,0.05)] transition-all duration-300 hover:-translate-y-1 hover:scale-[1.01] hover:shadow-md ${toneClasses.hover}`}>
      <div className={`absolute -right-8 -top-8 h-24 w-24 rounded-full ${toneClasses.wash}`} />
      <div className="relative flex min-h-[120px] flex-col">
        <div className="flex items-start justify-between gap-4">
          <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${toneClasses.accent}`}>
            <StatIcon tone={stat.tone} />
          </span>
        </div>
        <div className="mt-auto">
          <p className="text-3xl font-semibold tracking-tight text-slate-900">{stat.value}</p>
          <p className="mt-2 text-sm text-slate-700">{stat.label}</p>
        </div>
      </div>
    </article>
  );
}

function StatusPill({ status }: { status: VerificationStatus }) {
  const toneClass =
    status === "pending"
      ? "bg-[#dfe6ff] text-[#1d4ed8]"
      : status === "approved"
        ? "bg-[#68ead8] text-[#0f766e]"
        : "bg-[#ffdada] text-[#c81e1e]";

  return (
    <span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium capitalize ${toneClass}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

function Avatar({
  name,
  index,
  profileImageUrl,
}: {
  name: string;
  index: number;
  profileImageUrl?: string;
}) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const tones = [
    "bg-[#dce3ff] text-[#34468c]",
    "bg-[#c9f3e8] text-[#0f766e]",
    "bg-[#ffdccc] text-[#9a4a1f]",
    "bg-[#ffd8d8] text-[#b91c1c]",
  ];

  return (
    <div
      className={`flex h-8 w-8 items-center justify-center overflow-hidden rounded-full text-xs font-semibold ${tones[index % tones.length]}`}
    >
      {profileImageUrl ? (
        <img src={profileImageUrl} alt={name} className="h-full w-full object-cover" />
      ) : (
        initials || "ST"
      )}
    </div>
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
      className={`inline-flex min-h-8 cursor-pointer items-center justify-center rounded-md border px-4 text-sm disabled:cursor-not-allowed disabled:opacity-45 ${
        active
          ? "border-[#1454cc] bg-[#1454cc] font-semibold text-white"
          : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50"
      }`}
    >
      {label}
    </button>
  );
}

function StatIcon({ tone }: { tone: StatItem["tone"] }) {
  if (tone === "teal") {
    return <CheckCircleIcon />;
  }
  if (tone === "blue") {
    return <ClockIcon />;
  }
  if (tone === "peach") {
    return <ShieldCheckIcon />;
  }
  return <XCircleIcon />;
}

function CheckCircleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="8" />
      <path d="m8.8 12.2 2.1 2.1 4.4-4.7" />
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

function ReviewActionIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 5h14v14H5z" />
      <path d="M8 9h8" />
      <path d="M8 13h5" />
      <path d="m14.5 16 1.2 1.2 2.5-3" />
    </svg>
  );
}

function CloseSmallIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l2.5 2" />
    </svg>
  );
}

function ShieldCheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3 6 5.5v5.7c0 3.9 2.6 7.5 6 8.8 3.4-1.3 6-4.9 6-8.8V5.5L12 3Z" />
      <path d="m9.4 11.7 1.8 1.8 3.5-3.7" />
    </svg>
  );
}

function XCircleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="8" />
      <path d="m9.5 9.5 5 5" />
      <path d="m14.5 9.5-5 5" />
    </svg>
  );
}
