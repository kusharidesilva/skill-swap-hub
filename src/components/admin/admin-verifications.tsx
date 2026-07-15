"use client";

import { useEffect, useMemo, useState } from "react";
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
import { db, storage } from "@/lib/firebase";
import { createNotification } from "@/lib/notifications";
import type { ProviderVerificationStatus, StudentProofType } from "@/lib/platform";

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
  submittedAt?: { toDate?: () => Date } | Date | string | number | null;
};

type StatItem = {
  label: string;
  value: string;
  tone: "teal" | "blue" | "peach" | "rose";
};

export default function AdminVerifications() {
  const [rows, setRows] = useState<VerificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [downloadUrls, setDownloadUrls] = useState<Record<string, string>>({});

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
    rows.forEach((row) => {
      const storagePath = row.proof?.storagePath;
      if (!storagePath || row.proof?.downloadUrl || downloadUrls[row.id]) {
        return;
      }

      getDownloadURL(ref(storage, storagePath))
        .then((url) => {
          setDownloadUrls((current) => ({ ...current, [row.id]: url }));
        })
        .catch((err) => {
          console.error("Error resolving proof download URL:", err);
        });
    });
  }, [downloadUrls, rows]);

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

  const handleReview = async (row: VerificationRow, status: "approved" | "rejected") => {
    const adminNote = notes[row.id]?.trim() || "";
    setBusyId(row.id);
    setError("");

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
      } else {
        await updateDoc(userRef, {
          role: "buyer",
          accountStatus: "active",
          providerVerificationStatus: "rejected",
          canBuyServices: true,
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
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Error reviewing verification:", err);
      setError(err instanceof Error ? err.message : "Could not update verification.");
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

        <div className="flex items-center gap-3 self-start">
          <SearchBox />
          <button
            type="button"
            aria-label="Filter"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-600 shadow-[0_4px_10px_rgba(15,23,42,0.05)]"
          >
            <FilterIcon />
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
        <div className="grid grid-cols-[1.2fr_1.4fr_1.2fr_0.85fr_0.85fr_1.25fr_1.1fr] gap-4 border-b border-slate-300 bg-[#f0f1ff] px-6 py-5 text-[12px] font-medium text-slate-700">
          <span>Student</span>
          <span>University</span>
          <span>Programme</span>
          <span>Proof Type</span>
          <span>Status</span>
          <span>Admin Note</span>
          <span>Actions</span>
        </div>

        {loading ? (
          <div className="flex h-56 items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#2b62e6] border-t-transparent" />
          </div>
        ) : rows.length ? (
          rows.map((row, index) => (
            <div
              key={row.id}
              className="grid grid-cols-[1.2fr_1.4fr_1.2fr_0.85fr_0.85fr_1.25fr_1.1fr] items-center gap-4 border-b border-slate-300 px-6 py-4 last:border-b-0"
            >
              <div className="flex items-center gap-3">
                <Avatar name={row.studentName} index={index} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">{row.studentName}</p>
                  <p className="truncate text-xs text-slate-500">{row.email}</p>
                  <p className="mt-0.5 text-[11px] text-slate-400">{formatDate(row.submittedAt)}</p>
                </div>
              </div>
              <span className="text-sm text-slate-700">{row.university}</span>
              <span className="text-sm text-slate-700">
                {row.degree}
                <span className="mt-1 block text-xs text-slate-400">{row.yearOfStudy}</span>
              </span>
              <span className="text-sm text-slate-700">
                {row.proof?.fileType || "Student ID"}
                {(row.proof?.downloadUrl || downloadUrls[row.id]) ? (
                  <a
                    href={row.proof?.downloadUrl || downloadUrls[row.id]}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 block text-xs font-semibold text-[#1454cc]"
                  >
                    View File
                  </a>
                ) : null}
              </span>
              <StatusPill status={row.status} />
              <textarea
                value={notes[row.id] || ""}
                onChange={(event) => setNotes((current) => ({ ...current, [row.id]: event.target.value }))}
                placeholder="Add note"
                className="min-h-[58px] resize-none rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#2b62e6] focus:ring-2 focus:ring-blue-100"
              />
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => handleReview(row, "approved")}
                  disabled={busyId === row.id || row.status === "approved"}
                  className="inline-flex h-9 items-center justify-center rounded-lg bg-[#2f66e7] px-3 text-xs font-semibold text-white transition hover:bg-[#2457cc] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => handleReview(row, "rejected")}
                  disabled={busyId === row.id || row.status === "rejected"}
                  className="inline-flex h-9 items-center justify-center rounded-lg border border-red-200 bg-red-50 px-3 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Reject
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
          <p className="px-2">Showing {rows.length} verification request{rows.length === 1 ? "" : "s"}</p>
          <div className="flex items-center gap-2">
            <PagerButton label="Previous" />
            <PagerButton label="1" active />
            <PagerButton label="Next" />
          </div>
        </div>
      </section>
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

function StatCard({ stat }: { stat: StatItem }) {
  const toneClasses =
    stat.tone === "teal"
      ? {
          accent: "bg-[#66ead9] text-[#006d63]",
          wash: "bg-[#d9faf3]",
        }
      : stat.tone === "blue"
        ? {
            accent: "bg-[#dfe5ff] text-[#21367d]",
            wash: "bg-[#e5ecff]",
          }
        : stat.tone === "peach"
          ? {
              accent: "bg-[#ffdccc] text-[#9a4a1f]",
              wash: "bg-[#faeadf]",
            }
          : {
              accent: "bg-[#ffd8d8] text-[#b91c1c]",
              wash: "bg-[#fbe9e9]",
            };

  return (
    <article className="relative overflow-hidden rounded-2xl border border-slate-300 bg-white p-5 shadow-[0_6px_18px_rgba(15,23,42,0.05)]">
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

function SearchBox() {
  return (
    <div className="flex h-11 w-[258px] items-center gap-3 rounded-xl border border-slate-300 bg-white px-4 text-slate-500 shadow-[0_4px_10px_rgba(15,23,42,0.05)]">
      <SearchIcon />
      <span className="text-sm text-slate-500">Search here.</span>
    </div>
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

function Avatar({ name, index }: { name: string; index: number }) {
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
    <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${tones[index % tones.length]}`}>
      {initials || "ST"}
    </div>
  );
}

function PagerButton({ label, active }: { label: string; active?: boolean }) {
  return (
    <button
      type="button"
      className={`inline-flex min-h-8 items-center justify-center rounded-md border px-4 text-sm ${
        active
          ? "border-[#1454cc] bg-[#1454cc] font-semibold text-white"
          : "border-slate-300 bg-white text-slate-700"
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

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[19px] w-[19px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[19px] w-[19px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6h16" />
      <path d="M7 12h10" />
      <path d="M10 18h4" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="8" />
      <path d="m8.8 12.2 2.1 2.1 4.4-4.7" />
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
