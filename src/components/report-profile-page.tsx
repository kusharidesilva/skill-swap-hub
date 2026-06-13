"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import type { Role } from "@/lib/role-routes";

type ReportProfilePageProps = {
  providerName: string;
  role: Role;
};

interface ReportHistoryItem {
  id: string;
  targetName: string;
  category: string;
  status: string;
}

export default function ReportProfilePage({
  providerName,
  role,
}: ReportProfilePageProps) {
  const { userProfile } = useAuth();
  const [targetUser, setTargetUser] = useState(
    providerName === "Select a user" ? "" : providerName
  );
  const [category, setCategory] = useState("Choose a category");
  const [description, setDescription] = useState("");
  const [isAgreed, setIsAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  const [usersList, setUsersList] = useState<{ id: string; name: string }[]>([]);
  const [historyRows, setHistoryRows] = useState<ReportHistoryItem[]>([]);

  // Fetch all users to populate reporting options if not pre-provided
  useEffect(() => {
    async function fetchUsers() {
      try {
        const snap = await getDocs(collection(db, "users"));
        const list: { id: string; name: string }[] = [];
        snap.forEach((d) => {
          if (userProfile && d.id !== userProfile.uid) {
            list.push({ id: d.id, name: d.data().name || "Member" });
          }
        });
        setUsersList(list);
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    }
    if (userProfile) {
      fetchUsers();
    }
  }, [userProfile]);

  // Real-time listener for report history
  useEffect(() => {
    if (!userProfile) return;

    const q = query(
      collection(db, "reports"),
      where("reporterId", "==", userProfile.uid),
      where("type", "==", "profile")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: ReportHistoryItem[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          items.push({
            id: d.id,
            targetName: data.targetUserName || "Unknown User",
            category: data.category || "General",
            status: data.status || "Pending",
          });
        });
        setHistoryRows(items);
      },
      (err) => {
        console.error("Error fetching reports history:", err);
      }
    );

    return () => unsubscribe();
  }, [userProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;

    if (!targetUser || targetUser === "Select a user") {
      setFeedback({ type: "error", msg: "Please specify who you are reporting." });
      return;
    }
    if (category === "Choose a category") {
      setFeedback({ type: "error", msg: "Please select a category for your report." });
      return;
    }
    if (description.trim().length < 10) {
      setFeedback({
        type: "error",
        msg: "Please provide a detailed description (min 10 characters).",
      });
      return;
    }
    if (!isAgreed) {
      setFeedback({
        type: "error",
        msg: "You must verify that the information is accurate.",
      });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      await addDoc(collection(db, "reports"), {
        type: "profile",
        reporterId: userProfile.uid,
        reporterName: userProfile.name || "Reporter",
        targetUserName: targetUser,
        category,
        description: description.trim(),
        status: "Pending",
        createdAt: serverTimestamp(),
      });

      setFeedback({
        type: "success",
        msg: "Your report has been submitted to Trust & Safety successfully.",
      });
      setDescription("");
      setIsAgreed(false);
    } catch (err) {
      console.error("Error submitting report:", err);
      setFeedback({ type: "error", msg: "Failed to submit report. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex w-full flex-col gap-5 pb-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Trust & Safety Center</h1>
          <p className="mt-1 max-w-2xl text-xs text-slate-500">
            We are committed to maintaining a high-quality community. If you encounter any
            issues during an exchange or with another user, please let us know immediately.
          </p>
        </div>
        <div className="rounded-lg border border-teal-100 bg-teal-50/50 px-4 py-2.5">
          <p className="text-xs font-semibold text-teal-800">Community Protection</p>
          <p className="text-[10px] text-teal-600">All reports are confidential.</p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
            <h2 className="text-xs font-semibold text-slate-800">Report a Problem</h2>
            <p className="text-[10px] text-slate-500">Provide as much detail as possible.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 p-4">
            {feedback && (
              <div
                className={`rounded-lg px-3 py-2 text-xs font-medium border ${
                  feedback.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : "bg-red-50 text-red-800 border-red-200"
                }`}
              >
                {feedback.msg}
              </div>
            )}

            <Field label="Who are you reporting?">
              {providerName !== "Select a user" ? (
                <input
                  type="text"
                  readOnly
                  value={targetUser}
                  className="h-9 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-xs text-slate-600 outline-none cursor-not-allowed"
                />
              ) : (
                <select
                  value={targetUser}
                  onChange={(e) => setTargetUser(e.target.value)}
                  title="Who are you reporting?"
                  className={inputClassName}
                >
                  <option value="">Select a user</option>
                  {usersList.map((u) => (
                    <option key={u.id} value={u.name}>
                      {u.name}
                    </option>
                  ))}
                </select>
              )}
            </Field>

            <Field label="Reason for Report">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                title="Reason for Report"
                className={inputClassName}
              >
                <option value="Choose a category">Choose a category</option>
                <option value="No-show">No-show</option>
                <option value="Low quality service">Low quality service</option>
                <option value="Abusive behavior">Abusive behavior</option>
                <option value="Fraud concern">Fraud concern</option>
                <option value="Other">Other reason</option>
              </select>
            </Field>

            <Field label="Detailed Description">
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain what happened in detail..."
                className="w-full resize-none rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#2f66e7] focus:ring-2 focus:ring-blue-100"
              />
              <p className="mt-1 text-[10px] text-slate-400">
                Minimum 10 characters requested for verification.
              </p>
            </Field>

            <Field label="Supporting Evidence">
              <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-5 text-center">
                <p className="text-xs text-slate-600">
                  Drag & drop files or{" "}
                  <button type="button" className="font-semibold text-[#1453c4] underline">
                    click to browse
                  </button>
                </p>
                <p className="mt-0.5 text-[10px] text-slate-400">
                  Screenshots, PDFs, or relevant chat logs (Max 10MB)
                </p>
              </div>
            </Field>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-3.5">
              <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAgreed}
                  onChange={(e) => setIsAgreed(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-slate-300"
                />
                I verify this information is accurate.
              </label>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex h-9 items-center justify-center rounded-md bg-[#e11d48] px-4 text-xs font-semibold text-white transition hover:bg-[#c7173f] disabled:opacity-50"
              >
                {isSubmitting ? "Submitting..." : "Submit Report"}
              </button>
            </div>
          </form>
        </section>

        <aside className="space-y-4">
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-4 py-3">
              <h3 className="text-xs font-semibold text-slate-800">Your Reporting History</h3>
            </div>
            <div className="grid grid-cols-[1fr_1fr_1fr] bg-slate-50 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <p>Target User</p>
              <p>Category</p>
              <p>Status</p>
            </div>
            <div className="divide-y divide-slate-100 max-h-[260px] overflow-y-auto">
              {historyRows.length === 0 ? (
                <p className="p-4 text-center text-[11px] text-slate-400">No previous reports found.</p>
              ) : (
                historyRows.map((row) => (
                  <div
                    key={row.id}
                    className="grid grid-cols-[1fr_1fr_1fr] items-center gap-2 px-4 py-3 text-xs text-slate-600"
                  >
                    <p className="font-semibold text-slate-700 truncate">{row.targetName}</p>
                    <p className="truncate">{row.category}</p>
                    <span
                      className={`inline-flex w-fit rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        row.status === "Pending"
                          ? "bg-amber-105 text-amber-700 bg-amber-50"
                          : "bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      {row.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 shadow-sm">
            <h3 className="text-xs font-semibold text-indigo-900">Submission Tips</h3>
            <ul className="mt-2 space-y-2 text-xs leading-5 text-indigo-900/80">
              <li>• Attach evidence: include screenshots or chat logs.</li>
              <li>• Timeliness: report within 24 hours for faster response.</li>
              <li>• Stay professional and objective in your description.</li>
            </ul>
          </section>
        </aside>
      </div>

      <p className="text-[10px] text-slate-400">Logged-in role: {role}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
      {children}
    </label>
  );
}

const inputClassName =
  "h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-xs text-slate-700 outline-none transition focus:border-[#2f66e7] focus:ring-2 focus:ring-blue-100";

