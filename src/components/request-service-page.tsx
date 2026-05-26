"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { collection, addDoc, query, where, onSnapshot, doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { scopedHref, type Role } from "@/lib/role-routes";
import { type UserProfile } from "@/lib/auth";

const skillCategories = [
  "Programming",
  "UX Design",
  "Graphic Design",
  "Mathematics",
  "Photography",
  "Video Editing",
  "Data Analysis",
  "Web Development",
  "Content Writing",
  "Music",
];

const levelOptions = ["Beginner", "Intermediate", "Advanced"];

type RequestServiceContentProps = {
  role?: Role;
};

interface RequestData {
  id: string;
  category: string;
  title: string;
  description: string;
  status: string;
  providerId: string;
  providerName: string;
  level: string;
  serviceType: string;
  time: string;
  budget: string;
  revisionNotes?: string;
  review?: {
    rating: number;
    comment: string;
  };
  providerReview?: {
    rating: number;
    comment: string;
  };
}

export default function RequestServiceContent({
  role = "buyer",
}: RequestServiceContentProps) {
  const { userProfile, loading, refreshProfile } = useAuth();
  const searchParams = useSearchParams();
  const providerIdParam = searchParams.get("providerId");

  const [providerName, setProviderName] = useState(() =>
    providerIdParam ? "" : "General / Public Request"
  );
  const [prevProviderIdParam, setPrevProviderIdParam] = useState(providerIdParam);

  if (providerIdParam !== prevProviderIdParam) {
    setPrevProviderIdParam(providerIdParam);
    setProviderName(providerIdParam ? "" : "General / Public Request");
  }

  const targetProviderId = providerIdParam || "general";

  // Fetch designated provider info if target providerId is passed in search query
  useEffect(() => {
    if (!providerIdParam) return;

    const providerId = providerIdParam;
    let active = true;
    async function fetchProvider() {
      try {
        const providerDoc = await getDoc(doc(db, "users", providerId));
        if (!active) return;
        if (providerDoc.exists()) {
          setProviderName(providerDoc.data().name || "Specified Provider");
        } else {
          setProviderName("Direct Request");
        }
      } catch (err) {
        if (!active) return;
        console.error("Error fetching target provider:", err);
        setProviderName("Direct Request");
      }
    }
    fetchProvider();
    return () => {
      active = false;
    };
  }, [providerIdParam]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#2b62e6] border-t-transparent" />
          <p className="text-sm text-slate-500">Loading request service panel...</p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">Please sign in to request a service.</p>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-8 pb-10">
      <header>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">Request a Service</h1>
        <p className="mt-1 text-xs text-slate-500">
          Describe clearly what help you need so the system can match you or notify the provider.
        </p>
        {providerIdParam && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700 border border-blue-100">
            ✉️ Direct Request to: <span className="underline">{providerName}</span>
          </div>
        )}
      </header>

      <section className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
        <RequestForm
          buyerProfile={userProfile}
          providerId={targetProviderId}
          providerName={providerName}
          refreshProfile={refreshProfile}
        />
        <RecentRequestsPanel buyerId={userProfile.uid} role={role} />
      </section>
    </div>
  );
}

function RequestForm({
  buyerProfile,
  providerId,
  providerName,
  refreshProfile,
}: {
  buyerProfile: UserProfile;
  providerId: string;
  providerName: string;
  refreshProfile: () => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(skillCategories[0]);
  const [description, setDescription] = useState("");
  const [level, setLevel] = useState(levelOptions[0]);
  const [serviceType, setServiceType] = useState("Skill Exchange");
  const [time, setTime] = useState("");
  const [preferredUniv, setPreferredUniv] = useState("");
  const [budget, setBudget] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setFeedback({ type: "error", msg: "Please fill out the Skill Needed and Description fields." });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      await addDoc(collection(db, "requests"), {
        buyerId: buyerProfile.uid,
        buyerName: buyerProfile.name,
        buyerUniversity: buyerProfile.university || "",
        buyerDegree: buyerProfile.degree || "",
        buyerYearOfStudy: buyerProfile.yearOfStudy || "",
        providerId,
        providerName,
        title: title.trim(),
        category,
        description: description.trim(),
        level,
        serviceType,
        time: time.trim() || "Flexible",
        university: preferredUniv.trim() || "Any University",
        budget: budget.trim() || "Free Swap",
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // If this user is currently a pure provider who just made their first
      // buyer request, upgrade their Firestore role to "both" so the
      // navbar/shell immediately shows the correct dual-role UI.
      if (buyerProfile.role === "provider") {
        await updateDoc(doc(db, "users", buyerProfile.uid), { role: "both" });
        await refreshProfile();
      }

      setFeedback({ type: "success", msg: "Your skill swap request has been submitted successfully!" });
      setTitle("");
      setDescription("");
      setTime("");
      setPreferredUniv("");
      setBudget("");
    } catch (err) {
      console.error("Error submitting request:", err);
      const msg = err instanceof Error ? err.message : "Failed to submit request.";
      setFeedback({ type: "error", msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <form onSubmit={handleSubmit} className="grid gap-4">
        {feedback && (
          <div
            className={`rounded-lg px-4 py-3 text-sm font-semibold border ${
              feedback.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-red-50 text-red-800 border-red-200"
            }`}
          >
            {feedback.msg}
          </div>
        )}

        {/* Skill Needed and Category */}
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid min-w-0 gap-1.5">
            <span className="text-xs font-semibold text-slate-600">Skill Needed</span>
            <input
              type="text"
              placeholder="e.g., Python Data Analysis"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={fieldClassName}
            />
          </label>

          <label className="grid min-w-0 gap-1.5">
            <span className="text-xs font-semibold text-slate-600">Skill Category</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              title="Skill Category"
              className={fieldClassName}
            >
              {skillCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="grid min-w-0 gap-1.5">
          <span className="text-xs font-semibold text-slate-600">Description</span>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detail the specific tasks, project scope, or areas you need help with..."
            className="w-full resize-none rounded-lg border border-slate-300 bg-[#f7f8ff] px-3 py-2 text-sm leading-relaxed text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#2f66e7] focus:ring-4 focus:ring-blue-100"
          />
        </label>

        {/* Required Level and Service Type */}
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid min-w-0 gap-1.5">
            <span className="text-xs font-semibold text-slate-600">Required Level</span>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              title="Required Level"
              className={fieldClassName}
            >
              {levelOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </label>

          <label className="grid min-w-0 gap-1.5">
            <span className="text-xs font-semibold text-slate-600">Service Type</span>
            <div className="flex max-w-[280px] flex-wrap items-center gap-1.5 pt-1">
              {["Free Help", "Skill Exchange", "Paid"].map((type) => (
                <button
                  type="button"
                  key={type}
                  onClick={() => setServiceType(type)}
                  className={`inline-flex h-7 items-center justify-center rounded-full border px-2.5 text-[10px] font-bold leading-none transition ${
                    serviceType === type
                      ? "border-[#2f66e7] bg-[#2f66e7] text-white"
                      : "border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </label>
        </div>

        {/* Preferred Date/ Time, University, and Budget */}
        <div className="grid items-end gap-3 md:grid-cols-3">
          <label className="grid min-w-0 gap-1.5">
            <span className="text-xs font-semibold text-slate-600">Preferred Date/ Time</span>
            <input
              type="text"
              placeholder="e.g., Weekends, Evenings"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className={fieldClassName}
            />
          </label>

          <label className="grid min-w-0 gap-1.5">
            <span className="text-xs font-semibold text-slate-600">Preferred University</span>
            <input
              type="text"
              placeholder="e.g., State Uni"
              value={preferredUniv}
              onChange={(e) => setPreferredUniv(e.target.value)}
              className={fieldClassName}
            />
          </label>

          <label className="grid min-w-0 gap-1.5">
            <span className="text-xs font-semibold text-slate-600">Budget (Optional)</span>
            <input
              type="text"
              placeholder="e.g., Free Swap"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className={fieldClassName}
            />
          </label>
        </div>

        {/* Submit Button */}
        <div className="border-t border-slate-200 pt-4">
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#2f66e7] px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-[#2557cf] disabled:opacity-60 sm:w-auto sm:min-w-44"
            >
              {isSubmitting ? "Submitting..." : "Submit Request"}
              <SendIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}

function RecentRequestsPanel({ buyerId, role }: { buyerId: string; role: Role }) {
  const [requests, setRequests] = useState<RequestData[]>([]);
  const [loading, setLoading] = useState(true);

  // States to reveal interactive review form per card
  const [activeReviewId, setActiveReviewId] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  // States to reveal interactive revision input per card
  const [activeRevisionId, setActiveRevisionId] = useState<string | null>(null);
  const [revisionText, setRevisionText] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 3;

  // Real-time listener on requests submitted by this buyer
  useEffect(() => {
    const q = query(
      collection(db, "requests"),
      where("buyerId", "==", buyerId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs: RequestData[] = [];
      snapshot.forEach((docSnap) => {
        docs.push({ id: docSnap.id, ...docSnap.data() } as RequestData);
      });
      // Sort client-side if serverTimestamp is loading/null
      docs.sort((a, b) => b.id.localeCompare(a.id));
      setRequests(docs);
      setLoading(false);
      
      // Reset to page 1 if current page would be empty after updates
      const maxPages = Math.ceil(docs.length / ITEMS_PER_PAGE);
      setCurrentPage((currentVal) => {
        if (currentVal > maxPages && maxPages > 0) {
          return 1;
        }
        return currentVal;
      });
    }, (err) => {
      console.error("Error loading recent requests:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [buyerId]);

  // Compute pages and slice requests
  const totalPages = Math.ceil(requests.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const displayedRequests = requests.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Handle accepting work & adding review
  const handleAcceptComplete = async (reqId: string) => {
    try {
      await updateDoc(doc(db, "requests", reqId), {
        status: "completed",
        updatedAt: serverTimestamp(),
        review: {
          rating: reviewRating,
          comment: reviewComment.trim() || "Outstanding swap session!",
        },
      });
      setActiveReviewId(null);
      setReviewComment("");
      setReviewRating(5);
    } catch (err) {
      console.error("Error completing request:", err);
    }
  };

  // Handle requesting changes / sending revision notes
  const handleRequestRevision = async (reqId: string) => {
    if (!revisionText.trim()) return;
    try {
      await updateDoc(doc(db, "requests", reqId), {
        status: "revision",
        revisionNotes: revisionText.trim(),
        updatedAt: serverTimestamp(),
      });
      setActiveRevisionId(null);
      setRevisionText("");
    } catch (err) {
      console.error("Error requesting revision:", err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return { label: "Pending Match", style: "bg-amber-100 text-amber-800 border-amber-200" };
      case "working":
        return { label: "In Progress / Working", style: "bg-blue-100 text-blue-800 border-blue-200" };
      case "done":
        return { label: "Marked Done by Provider", style: "bg-purple-100 text-purple-800 border-purple-200 border-2 animate-pulse" };
      case "revision":
        return { label: "Revision Sent", style: "bg-rose-100 text-rose-800 border-rose-200" };
      case "completed":
        return { label: "Completed", style: "bg-emerald-100 text-emerald-800 border-emerald-200" };
      case "rejected":
        return { label: "Declined", style: "bg-slate-100 text-slate-600 border-slate-200" };
      default:
        return { label: status, style: "bg-slate-100 text-slate-600 border-slate-200" };
    }
  };

  if (loading) {
    return (
      <aside className="min-w-0">
        <h2 className="text-2xl font-semibold text-slate-900">Recent Requests</h2>
        <div className="mt-4 flex items-center justify-center p-6 text-sm text-slate-500">
          Loading requests...
        </div>
      </aside>
    );
  }

  return (
    <aside className="min-w-0">
      <h2 className="text-2xl font-semibold text-slate-900">Recent Requests</h2>

      <div className="mt-4 grid gap-4 max-h-[700px] overflow-y-auto pr-1">
        {displayedRequests.length > 0 ? (
          displayedRequests.map((item) => {
            const badge = getStatusBadge(item.status);
            return (
              <article
                key={item.id}
                className={`rounded-2xl border bg-white p-5 shadow-[0_10px_26px_rgba(15,23,42,0.03)] border-slate-200/80`}
              >
                <div className="flex flex-col gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-full bg-blue-50 border border-blue-100 px-3 py-0.5 text-xs font-semibold text-blue-700">
                      {item.category}
                    </span>
                    <span className="text-[11px] font-medium text-slate-400">
                      To: {item.providerName.split(" ")[0]}
                    </span>
                  </div>
                  
                  <span className={`inline-block self-start rounded-lg border px-3 py-1 text-xs font-semibold ${badge.style}`}>
                    {badge.label}
                  </span>
                </div>

                <h3 className="mt-3 text-lg font-bold leading-7 text-slate-900">
                  {item.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600 line-clamp-3">
                  {item.description}
                </p>

                {item.status === "revision" && item.revisionNotes && (
                  <div className="mt-3 rounded-lg bg-rose-50 border border-rose-100 p-2.5 text-xs text-rose-700">
                    <strong className="block font-bold">Your Revision Notes:</strong>
                    &ldquo;{item.revisionNotes}&rdquo;
                  </div>
                )}

                {/* DONE ACTION PANEL - Buyer selects to Approve or Request Updates */}
                {item.status === "done" && !activeReviewId && !activeRevisionId && (
                  <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-3">
                    <p className="text-xs font-semibold text-slate-500">Provider finished! Check the work:</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setActiveReviewId(item.id)}
                        className="flex-1 rounded-lg bg-emerald-600 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                      >
                        ✓ Accept & Complete
                      </button>
                      <button
                        onClick={() => setActiveRevisionId(item.id)}
                        className="flex-1 rounded-lg border border-red-300 py-2 text-xs font-bold text-red-700 hover:bg-red-50"
                      >
                        ⚠️ Has Errors / Revise
                      </button>
                    </div>
                  </div>
                )}

                {/* Interactive Rating Form */}
                {activeReviewId === item.id && (
                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/40 p-3.5 transition">
                    <p className="text-xs font-bold text-slate-800">Rate Provider Session:</p>
                    <div className="flex gap-1.5 mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => setReviewRating(star)}
                          className={`text-2xl transition ${
                            reviewRating >= star ? "text-amber-500 scale-110" : "text-slate-300"
                          }`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                    <textarea
                      placeholder="How did they do? Share your helpful review..."
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      className="mt-2.5 w-full rounded-md border border-slate-300 bg-white p-2 text-xs text-slate-700 outline-none"
                      rows={2}
                    />
                    <div className="mt-2 flex gap-2 justify-end">
                      <button
                        onClick={() => setActiveReviewId(null)}
                        className="rounded px-3 py-1.5 text-[10px] font-semibold text-slate-500"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleAcceptComplete(item.id)}
                        className="rounded bg-emerald-600 px-3.5 py-1.5 text-[10px] font-bold text-white hover:bg-emerald-700 shadow-sm"
                      >
                        Submit & Complete
                      </button>
                    </div>
                  </div>
                )}

                {/* Interactive Revision Form */}
                {activeRevisionId === item.id && (
                  <div className="mt-4 rounded-xl border border-red-200 bg-red-50/40 p-3.5 transition">
                    <p className="text-xs font-bold text-slate-800">Describe the changes needed:</p>
                    <textarea
                      placeholder="List what needs to be fixed or updated by the provider..."
                      value={revisionText}
                      onChange={(e) => setRevisionText(e.target.value)}
                      className="mt-2 w-full rounded-md border border-slate-300 bg-white p-2 text-xs text-slate-700 outline-none"
                      rows={2}
                    />
                    <div className="mt-2 flex gap-2 justify-end">
                      <button
                        onClick={() => setActiveRevisionId(null)}
                        className="rounded px-3 py-1.5 text-[10px] font-semibold text-slate-500"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleRequestRevision(item.id)}
                        disabled={!revisionText.trim()}
                        className="rounded bg-red-600 px-3.5 py-1.5 text-[10px] font-bold text-white hover:bg-red-700 shadow-sm disabled:opacity-50"
                      >
                        Send to Provider
                      </button>
                    </div>
                  </div>
                )}

                 {/* Completed Details */}
                 {item.status === "completed" && (
                   <div className="mt-3 space-y-2">
                     {item.review && (
                       <div className="rounded-lg bg-emerald-50/50 border border-emerald-100 p-2.5 text-xs text-emerald-800">
                         <span className="font-bold block">✓ Your Review of Provider:</span>
                         <span className="text-amber-600 font-bold">{"★".repeat(item.review.rating)}{"☆".repeat(5 - item.review.rating)}</span>
                         <p className="italic mt-0.5">&ldquo;{item.review.comment}&rdquo;</p>
                       </div>
                     )}
                     
                     {item.providerReview ? (
                       <div className="rounded-lg bg-blue-50/60 border border-blue-100 p-2.5 text-xs text-blue-800">
                         <span className="font-bold block">★ {"Provider's Review of You"}:</span>
                         <span className="text-blue-500 font-bold">{"★".repeat(item.providerReview.rating)}{"☆".repeat(5 - item.providerReview.rating)}</span>
                         <p className="italic mt-0.5">&ldquo;{item.providerReview.comment}&rdquo;</p>
                       </div>
                     ) : (
                       <div className="rounded-lg bg-slate-50 border border-slate-200/60 p-2.5 text-xs text-slate-500 italic">
                         {"Awaiting Provider's feedback on your performance."}
                       </div>
                     )}
                   </div>
                 )}

                {item.status === "working" && (
                  <div className="mt-4 border-t border-slate-100 pt-3">
                    <Link
                      href={scopedHref("/chats", role)}
                      className="inline-flex h-9 w-full items-center justify-center rounded-lg bg-blue-600 px-4 text-xs font-bold text-white shadow-xs transition hover:bg-blue-700"
                    >
                      <ChatIcon className="mr-1.5 h-3.5 w-3.5" />
                      Open Session Chat
                    </Link>
                  </div>
                )}
              </article>
            );
          })
        ) : (
          <div className="rounded-xl border border-slate-200 border-dashed bg-slate-50/40 p-8 text-center text-sm text-slate-500">
            You have not submitted any swap requests yet.
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="inline-flex h-8 items-center justify-center rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-bold text-slate-700 shadow-xs transition hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed select-none"
          >
            ← Prev
          </button>
          
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalPages }).map((_, idx) => {
              const pageNum = idx + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-extrabold transition-all duration-150 ${
                    currentPage === pageNum
                      ? "bg-[#2f66e7] text-white shadow-xs"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-800 border border-transparent hover:border-slate-200"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="inline-flex h-8 items-center justify-center rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-bold text-slate-700 shadow-xs transition hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed select-none"
          >
            Next →
          </button>
        </div>
      )}

      {requests.length > 3 && (
        <div className="mt-3">
          <Link
            href={role === "buyer" ? "/request-service/all" : `/request-service/${role}/all`}
            className="inline-flex h-9 w-full items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-xs font-bold text-[#2f66e7] shadow-sm hover:bg-slate-50 transition-colors"
          >
            View All Requests ({requests.length}) →
          </Link>
        </div>
      )}
    </aside>
  );
}

const fieldClassName =
  "h-10 w-full rounded-lg border border-slate-300 bg-[#f7f8ff] px-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#2f66e7] focus:ring-4 focus:ring-blue-100";

function ChatIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M4 5h16v11H7l-3 3z" />
    </svg>
  );
}

function SendIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M4 12h14" />
      <path d="M13 5l7 7-7 7" />
    </svg>
  );
}
