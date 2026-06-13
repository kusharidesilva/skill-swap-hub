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
  serverTimestamp,
} from "firebase/firestore";

interface TicketHistoryItem {
  id: string;
  subject: string;
  category: string;
  severity: string;
  status: string;
}

export default function ReportIssuePageContent() {
  const { userProfile } = useAuth();
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("Bug / Technical Issue");
  const [severity, setSeverity] = useState("Medium");
  const [description, setDescription] = useState("");
  const [isAgreed, setIsAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  const [historyRows, setHistoryRows] = useState<TicketHistoryItem[]>([]);

  // Real-time listener for reported issues/tickets
  useEffect(() => {
    if (!userProfile) return;

    const q = query(
      collection(db, "reports"),
      where("reporterId", "==", userProfile.uid),
      where("type", "==", "issue")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: TicketHistoryItem[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          items.push({
            id: d.id,
            subject: data.subject || "No Subject",
            category: data.category || "General Support",
            severity: data.severity || "Medium",
            status: data.status || "Pending",
          });
        });
        setHistoryRows(items);
      },
      (err) => {
        console.error("Error fetching issue reports history:", err);
      }
    );

    return () => unsubscribe();
  }, [userProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;

    if (!subject.trim()) {
      setFeedback({ type: "error", msg: "Please enter a subject for the issue." });
      return;
    }
    if (description.trim().length < 10) {
      setFeedback({
        type: "error",
        msg: "Please provide a description of the issue (min 10 characters).",
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
        type: "issue",
        reporterId: userProfile.uid,
        reporterName: userProfile.name || "Reporter",
        reporterEmail: userProfile.email || "",
        subject: subject.trim(),
        category,
        severity,
        description: description.trim(),
        status: "Pending",
        createdAt: serverTimestamp(),
      });

      setFeedback({
        type: "success",
        msg: "Thank you! Your issue report has been logged and sent to tech support.",
      });
      setSubject("");
      setDescription("");
      setIsAgreed(false);
    } catch (err) {
      console.error("Error submitting issue report:", err);
      setFeedback({
        type: "error",
        msg: "Failed to log issue report. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex w-full flex-col gap-5 pb-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Support & Help Desk</h1>
          <p className="mt-1 max-w-2xl text-xs text-slate-500">
            Submit a support ticket for technical glitches, UI bugs, or general feedback about the platform.
          </p>
        </div>
        <div className="rounded-lg border border-blue-100 bg-blue-50/50 px-4 py-2.5">
          <p className="text-xs font-semibold text-blue-800">Quick Resolution</p>
          <p className="text-[10px] text-blue-600">Tickets are reviewed daily.</p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
            <h2 className="text-xs font-semibold text-slate-800">Log a Ticket</h2>
            <p className="text-[10px] text-slate-500">Describe the issue you're facing.</p>
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

            <Field label="Issue Subject">
              <input
                type="text"
                placeholder="e.g. Chat page not loading properly"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className={inputClassName}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Category">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  title="Category"
                  className={inputClassName}
                >
                  <option value="Bug / Technical Issue">Bug / Technical Issue</option>
                  <option value="Account Settings">Account Settings</option>
                  <option value="Feature Suggestion">Feature Suggestion</option>
                  <option value="General Support">General Support</option>
                </select>
              </Field>

              <Field label="Severity">
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  title="Severity"
                  className={inputClassName}
                >
                  <option value="Low">Low (Minor annoyance)</option>
                  <option value="Medium">Medium (Affects feature usage)</option>
                  <option value="High">High (Blocks key flows)</option>
                  <option value="Critical">Critical (System broken / crash)</option>
                </select>
              </Field>
            </div>

            <Field label="Detailed Description">
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="List the steps to reproduce, device/browser details, and what happened..."
                className="w-full resize-none rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#2f66e7] focus:ring-2 focus:ring-blue-100"
              />
              <p className="mt-1 text-[10px] text-slate-400">
                Minimum 10 characters requested for priority investigation.
              </p>
            </Field>

            <Field label="Attach Evidence / Screenshot">
              <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-5 text-center">
                <p className="text-xs text-slate-600">
                  Drag & drop files or{" "}
                  <button type="button" className="font-semibold text-[#1453c4] underline">
                    click to browse
                  </button>
                </p>
                <p className="mt-0.5 text-[10px] text-slate-400">
                  PNG, JPG, or PDF (Max 5MB)
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
                className="inline-flex h-9 items-center justify-center rounded-md bg-[#2f66e7] px-4 text-xs font-semibold text-white transition hover:bg-[#2051ca] disabled:opacity-50"
              >
                {isSubmitting ? "Logging Ticket..." : "Log Issue"}
              </button>
            </div>
          </form>
        </section>

        <aside className="space-y-4">
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-4 py-3">
              <h3 className="text-xs font-semibold text-slate-800">Your Support Tickets</h3>
            </div>
            <div className="grid grid-cols-[1.5fr_1fr_1fr] bg-slate-50 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <p>Subject</p>
              <p>Severity</p>
              <p>Status</p>
            </div>
            <div className="divide-y divide-slate-100 max-h-[260px] overflow-y-auto">
              {historyRows.length === 0 ? (
                <p className="p-4 text-center text-[11px] text-slate-400">No previous support tickets found.</p>
              ) : (
                historyRows.map((row) => (
                  <div
                    key={row.id}
                    className="grid grid-cols-[1.5fr_1fr_1fr] items-center gap-2 px-4 py-3 text-xs text-slate-600"
                  >
                    <p className="font-semibold text-slate-700 truncate">{row.subject}</p>
                    <p className="truncate">{row.severity}</p>
                    <span
                      className={`inline-flex w-fit rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        row.status === "Pending"
                          ? "bg-amber-50 text-amber-700"
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

          <section className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 shadow-sm">
            <h3 className="text-xs font-semibold text-blue-900">Ticket Resolution SLA</h3>
            <ul className="mt-2 space-y-2 text-xs leading-5 text-blue-900/80">
              <li>
                <strong>• Critical:</strong> Investigated within 4 hours.
              </li>
              <li>
                <strong>• High:</strong> Reviewed and answered within 24 hours.
              </li>
              <li>
                <strong>• Medium / Low:</strong> Resolved within 2-3 business days.
              </li>
            </ul>
          </section>
        </aside>
      </div>
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
