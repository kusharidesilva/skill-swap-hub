"use client";

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { scopedHref } from "@/lib/role-routes";

type IncomingRequestsTab = "new" | "accepted" | "completed" | "declined";

type IncomingRequestsPageContentProps = {
  activeTab?: IncomingRequestsTab;
  role?: "provider" | "both";
};

interface RequestData {
  id: string;
  buyerId: string;
  buyerName: string;
  buyerUniversity: string;
  buyerDegree: string;
  buyerYearOfStudy: string;
  title: string;
  category: string;
  description: string;
  level: string;
  serviceType: string;
  time: string;
  budget: string;
  status: string;
  revisionNotes?: string;
  review?: {
    rating: number;
    comment: string;
  };
}

export default function IncomingRequestsPageContent({
  activeTab = "new",
  role = "provider",
}: IncomingRequestsPageContentProps) {
  const { userProfile, loading } = useAuth();
  const [requests, setRequests] = useState<RequestData[]>([]);
  const [fetching, setFetching] = useState(true);

  // Real-time subscription to requests targeted at this provider
  useEffect(() => {
    if (!userProfile) return;

    const q = query(
      collection(db, "requests"),
      where("providerId", "in", [userProfile.uid, "general"])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs: RequestData[] = [];
      snapshot.forEach((docSnap) => {
        docs.push({ id: docSnap.id, ...docSnap.data() } as RequestData);
      });
      // Sort client-side
      docs.sort((a, b) => b.id.localeCompare(a.id));
      setRequests(docs);
      setFetching(false);
    }, (err) => {
      console.error("Error subscribing to incoming requests:", err);
      setFetching(false);
    });

    return () => unsubscribe();
  }, [userProfile]);

  const tabHref = (tab: IncomingRequestsTab) => `?tab=${tab}`;

  if (loading || fetching) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#2b62e6] border-t-transparent" />
          <p className="text-sm text-slate-500">Loading incoming requests...</p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">Please sign in to view skill requests.</p>
      </div>
    );
  }

  return (
    <section className="space-y-6 pb-10">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900 md:text-[2.9rem]">Skill Requests</h1>
        <p className="mt-2 text-lg text-slate-600">Manage requests from students needing your expertise.</p>
      </header>

      <div className="flex items-center gap-8 border-b border-slate-200">
        <TabLink href={tabHref("new")} label="New Requests" active={activeTab === "new"} />
        <TabLink href={tabHref("accepted")} label="Accepted / In Progress" active={activeTab === "accepted"} />
        <TabLink href={tabHref("completed")} label="Completed" active={activeTab === "completed"} />
        <TabLink href={tabHref("declined")} label="Declined" active={activeTab === "declined"} />
      </div>

      {activeTab === "new" && <NewRequestsView requests={requests.filter(r => r.status === "pending")} role={role} />}
      {activeTab === "accepted" && <AcceptedView requests={requests.filter(r => r.status === "working" || r.status === "revision" || r.status === "done")} role={role} />}
      {activeTab === "completed" && <CompletedView requests={requests.filter(r => r.status === "completed")} />}
      {activeTab === "declined" && <DeclinedView requests={requests.filter(r => r.status === "rejected")} />}
    </section>
  );
}

function TabLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`border-b-2 pb-3 text-[1.15rem] font-semibold ${
        active ? "border-[#1453c4] text-[#1453c4]" : "border-transparent text-slate-600"
      }`}
    >
      {label}
    </Link>
  );
}

function NewRequestsView({ requests, role }: { requests: RequestData[]; role: "provider" | "both" }) {
  const [category, setCategory] = useState("All Categories");
  const [university, setUniversity] = useState("Any University");

  // Filtering
  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      const categoryOk = category === "All Categories" || request.category === category;
      const universityOk =
        university === "Any University" ||
        request.buyerUniversity.toLowerCase().includes(university.toLowerCase()) ||
        university.toLowerCase().includes(request.buyerUniversity.toLowerCase());
      return categoryOk && universityOk;
    });
  }, [requests, category, university]);

  const activeRequest = filteredRequests[0] ?? requests[0];

  const handleDecision = async (reqId: string, status: "working" | "rejected") => {
    try {
      await updateDoc(doc(db, "requests", reqId), {
        status,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error(`Error updating request status to ${status}:`, err);
    }
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[340px_minmax(0,1fr)]">
      <article className="rounded-xl border border-slate-200 bg-[#f7f8ff] p-5 shadow-sm h-fit">
        <h2 className="text-[2rem] font-semibold text-slate-900">Filters</h2>
        <div className="mt-4 space-y-4">
          <Field
            label="Category"
            value={category}
            options={["All Categories", "Programming", "Design", "Writing", "Business", "Data Science"]}
            onChange={setCategory}
          />
          <Field
            label="University"
            value={university}
            options={["Any University", "University of Colombo", "University of Moratuwa", "SLIIT"]}
            onChange={setUniversity}
          />
        </div>
      </article>

      {activeRequest ? (
        <article className="rounded-xl border border-slate-200 bg-[#f7f8ff] p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-lg font-semibold text-slate-800">
                {activeRequest.buyerName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">{activeRequest.buyerName}</p>
                <p className="text-base text-slate-600">
                  {activeRequest.buyerDegree} - {activeRequest.buyerUniversity} ({activeRequest.buyerYearOfStudy})
                </p>
              </div>
            </div>
            <span className="rounded-full bg-teal-100 px-4 py-1 text-base font-semibold text-teal-700">Matched Buyer</span>
          </div>

          <div className="pt-4">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Skill Needed</p>
            <p className="mt-1 text-[1.9rem] font-semibold text-[#1453c4]">{activeRequest.title}</p>
            <p className="mt-2 max-w-3xl text-lg leading-8 text-slate-700">
              {activeRequest.description}
            </p>
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-600 border-t border-slate-100 pt-3">
              <span className="font-medium">📅 Time: {activeRequest.time}</span>
              <span className="font-medium">💼 Type: {activeRequest.serviceType}</span>
              <span className="font-medium">💰 Budget: {activeRequest.budget}</span>
              <span className="font-medium">🎓 Level: {activeRequest.level}</span>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleDecision(activeRequest.id, "working")}
                className="rounded-lg bg-emerald-600 hover:bg-emerald-700 px-5 py-2 text-base font-semibold text-white shadow-xs"
              >
                Accept Swap
              </button>
              <button
                onClick={() => handleDecision(activeRequest.id, "rejected")}
                className="rounded-lg border border-red-300 hover:bg-red-50 px-4 py-2 text-base font-semibold text-red-700"
              >
                Decline
              </button>
            </div>
            <div className="flex items-center gap-5 text-base font-semibold">
              <Link href={scopedHref("/chats", role)} className="text-[#1453c4] hover:underline">
                Chat Now
              </Link>
            </div>
          </div>
        </article>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-sm">
          No new incoming skill swap requests found.
        </div>
      )}
    </div>
  );
}

function AcceptedView({ requests, role }: { requests: RequestData[]; role: "provider" | "both" }) {
  const handleMarkDone = async (reqId: string) => {
    try {
      await updateDoc(doc(db, "requests", reqId), {
        status: "done",
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Error setting request status to done:", err);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {requests.length > 0 ? (
        requests.map((item) => (
          <article
            key={item.id}
            className={`rounded-xl border bg-white p-5 shadow-sm transition border-slate-200 ${
              item.status === "revision" ? "ring-2 ring-rose-500/50" : ""
            }`}
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <p className="text-[1.35rem] font-semibold leading-tight text-slate-900">{item.buyerName}</p>
                <p className="text-sm text-slate-600">{item.buyerUniversity}</p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  item.status === "revision"
                    ? "bg-rose-100 text-rose-800"
                    : item.status === "done"
                    ? "bg-purple-100 text-purple-800"
                    : "bg-teal-100 text-teal-800"
                }`}
              >
                {item.status === "revision" ? "Needs Update" : item.status === "done" ? "Finished" : "Working"}
              </span>
            </div>

            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Requested Skill</p>
            <p className="mt-1 text-[1.25rem] font-semibold text-[#1453c4]">{item.title}</p>
            
            <p className="mt-2 text-xs leading-5 text-slate-600 line-clamp-2">
              {item.description}
            </p>

            {/* Revision Alert Box */}
            {item.status === "revision" && item.revisionNotes && (
              <div className="mt-3 rounded-lg bg-rose-50 border border-rose-100 p-2.5 text-xs text-rose-700">
                <strong className="block font-bold">⚠️ Buyer Update Requests:</strong>
                &ldquo;{item.revisionNotes}&rdquo;
              </div>
            )}

            <div className="mt-3 rounded-lg bg-[#f3f4ff] p-2.5 text-xs text-slate-600">
              <span className="font-semibold">Budget: {item.budget}</span>
              <span className="mx-2">|</span>
              <span className="font-semibold">Preferred: {item.time}</span>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              {item.status !== "done" && (
                <button
                  onClick={() => handleMarkDone(item.id)}
                  className="rounded-lg bg-emerald-600 hover:bg-emerald-700 py-2.5 text-sm font-bold text-white shadow-xs"
                >
                  ✓ Mark as Done
                </button>
              )}
              <div className="flex gap-2">
                <Link
                  href={scopedHref("/chats", role)}
                  className="flex-1 rounded-lg border border-[#1453c4] px-3 py-2 text-center text-xs font-semibold text-[#1453c4] hover:bg-blue-50"
                >
                  Chat
                </Link>
                <span className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-center text-xs font-semibold text-slate-500 bg-slate-50 select-none">
                  {item.status === "done" ? "Awaiting Review" : "In Progress"}
                </span>
              </div>
            </div>
          </article>
        ))
      ) : (
        <div className="col-span-full rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-sm">
          No accepted or active requests at this time.
        </div>
      )}
    </div>
  );
}

function CompletedView({ requests }: { requests: RequestData[] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {requests.length > 0 ? (
        requests.map((item) => (
          <article key={item.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <p className="text-[1.35rem] font-semibold text-slate-900">{item.buyerName}</p>
                <p className="text-sm text-slate-600">{item.buyerUniversity}</p>
              </div>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">Completed</span>
            </div>
            
            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Exchanged Skill</p>
            <p className="mt-1 text-[1.4rem] font-semibold text-emerald-700">{item.title}</p>
            
            {item.review ? (
              <div className="mt-3.5 rounded-lg bg-amber-50/50 border border-amber-100 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-slate-800 text-xs">Review Received</p>
                  <p className="text-amber-500 font-bold">{"★".repeat(item.review.rating)}</p>
                </div>
                <p className="mt-1.5 italic text-slate-700 leading-relaxed">&ldquo;{item.review.comment}&rdquo;</p>
              </div>
            ) : (
              <div className="mt-3.5 rounded-lg bg-slate-50 p-3 text-xs italic text-slate-400">
                Completed but no review was provided.
              </div>
            )}
          </article>
        ))
      ) : (
        <div className="col-span-full rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-sm">
          No completed swap history found.
        </div>
      )}
    </div>
  );
}

function DeclinedView({ requests }: { requests: RequestData[] }) {
  return (
    <section className="space-y-4">
      {requests.length > 0 ? (
        requests.map((item) => (
          <article key={item.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-200 bg-white p-5 gap-4 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-100 text-lg font-bold text-slate-600">
                {item.buyerName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-[1.4rem] font-semibold text-slate-900">{item.buyerName}</p>
                <p className="text-sm text-slate-600">{item.title}</p>
                <p className="mt-1 text-xs text-slate-500">Declined Direct Skill Swap Request</p>
              </div>
            </div>
            <div className="flex items-center gap-4 self-end sm:self-auto">
              <span className="rounded bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 border border-rose-100">Declined</span>
            </div>
          </article>
        ))
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-sm">
          No declined requests found.
        </div>
      )}
    </section>
  );
}

function Field({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-base font-semibold text-slate-700">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-12 w-full rounded-lg border border-slate-300 bg-white px-3 text-base font-normal text-slate-700 outline-none focus:border-[#1453c4]"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
