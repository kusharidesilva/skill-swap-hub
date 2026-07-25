"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { scopedHref, type Role } from "@/lib/role-routes";
import { type UserProfile } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";
import SelectField from "@/components/ui/select-field";
import { useLookupOptions } from "@/lib/lookups";
import ModalPortal from "@/components/ui/modal-portal";

const requestServiceSchema = z.object({
  category: z.string().trim().min(1, "Service category is required."),
  requiredDate: z.string().trim().min(1, "Required date is required."),
  budgetPrice: z.string().trim().optional().or(z.literal("")),
  requestNote: z
    .string()
    .trim()
    .min(1, "Request note is required.")
    .refine((value) => value.length >= 10, "Request note must contain at least 10 characters."),
});

type RequestServiceFormValues = z.infer<typeof requestServiceSchema>;

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

  const targetProviderId = "general";
  const providerName = "General / Public Request";

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#2b62e6] border-t-transparent" />
          <p className="text-sm text-slate-500">
            Loading request service panel...
          </p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">
          Please sign in to request a service.
        </p>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-8 pb-10">
      {/* Page introduction */}
      <header>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Request a Service
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          Post a public request so verified providers can respond.
        </p>
      </header>

      {/* Request form and recent request timeline */}
      <section className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
        <RequestForm
          buyerProfile={userProfile}
          providerId={targetProviderId}
          providerName={providerName}
          refreshProfile={refreshProfile}
        />
        <RecentRequestsPanel buyerId={userProfile.uid} buyerName={userProfile.name} role={role} />
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const serviceCategories = useLookupOptions("serviceCategories");
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);
  const [invalidModalOpen, setInvalidModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [pendingSubmission, setPendingSubmission] =
    useState<RequestServiceFormValues | null>(null);
  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors },
  } = useForm<RequestServiceFormValues>({
    resolver: zodResolver(requestServiceSchema),
    defaultValues: {
      category: "",
      requiredDate: "",
      budgetPrice: "",
      requestNote: "",
    },
  });

  const getFieldClassName = (hasError: boolean) =>
    `${fieldClassName} ${
      hasError
        ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-100"
        : ""
    }`;

  const selectedCategory = useWatch({ control, name: "category" });

  useEffect(() => {
    if (!serviceCategories.length) return;
    const currentCategory = selectedCategory || "";
    if (currentCategory && !serviceCategories.includes(currentCategory)) {
      setValue("category", "", {
        shouldDirty: false,
        shouldValidate: true,
      });
    }
  }, [selectedCategory, serviceCategories, setValue]);

  const onInvalidSubmit = () => {
    setFeedback({
      type: "error",
      msg: "Please complete all required fields correctly before submitting.",
    });
    setInvalidModalOpen(true);
  };

  const onSubmit = (data: RequestServiceFormValues) => {
    setFeedback(null);
    setPendingSubmission(data);
    setConfirmModalOpen(true);
  };

  const submitConfirmedRequest = async () => {
    if (!pendingSubmission) return;

    setConfirmModalOpen(false);
    setFeedback(null);
    setFeedback(null);
    setIsSubmitting(true);

    try {
      const trimmedCategory = pendingSubmission.category.trim();
      const trimmedNote = pendingSubmission.requestNote.trim();
      const trimmedBudget = pendingSubmission.budgetPrice?.trim() || "";
      const trimmedRequiredDate = pendingSubmission.requiredDate?.trim() || "";
      const title = `${trimmedCategory} request`;
      await addDoc(collection(db, "requests"), {
        buyerId: buyerProfile.uid,
        buyerName: buyerProfile.name,
        buyerAccountType: buyerProfile.accountType || "",
        buyerUniversity: buyerProfile.university || "",
        buyerDegree: buyerProfile.degree || "",
        buyerYearOfStudy: buyerProfile.yearOfStudy || "",
        providerId,
        providerName,
        requestType: "general",
        requestStatus: "open",
        title,
        category: trimmedCategory,
        categoryId: slugify(trimmedCategory),
        description: trimmedNote,
        requestNote: trimmedNote,
        requiredDate: trimmedRequiredDate,
        budgetPrice: trimmedBudget,
        level: "",
        serviceType: "General Request",
        time: trimmedRequiredDate,
        university: "",
        budget: trimmedBudget ? `LKR ${trimmedBudget}` : "Open budget",
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Direct providers get a notification after the request is saved successfully.
      if (providerId && providerId !== "general") {
        await createNotification({
          userId: providerId,
          title: "New Service Request",
          description: `${buyerProfile.name} requested "${title}"`,
          type: "request",
          icon: "◆",
          tone: "blue",
        });
      }

      // A provider making their first buyer request now needs access to both modes.
      if (buyerProfile.role === "provider") {
        await updateDoc(doc(db, "users", buyerProfile.uid), { role: "both" });
        await refreshProfile();
      }

      setFeedback({
        type: "success",
        msg: "Your skill swap request has been submitted successfully!",
      });
      setPendingSubmission(null);
      reset({
        category: "",
        requiredDate: "",
        budgetPrice: "",
        requestNote: "",
      });
    } catch (err) {
      console.error("Error submitting request:", err);
      const msg =
        err instanceof Error ? err.message : "Failed to submit request.";
      setFeedback({ type: "error", msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    // The form owns validation and creates the request document.
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <form
        onSubmit={handleSubmit(onSubmit, onInvalidSubmit)}
        noValidate
        className="grid gap-4"
      >
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

        <SelectField
          label="Service Category *"
          value={selectedCategory}
          onChange={(nextValue) =>
            setValue("category", nextValue, {
              shouldDirty: true,
              shouldValidate: true,
            })
          }
          options={serviceCategories}
          placeholder="Select a service category"
          className="text-sm"
          error={errors.category?.message}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid min-w-0 gap-1.5">
            <span className="text-xs font-semibold text-slate-600">
              Required Date <span className="text-red-500">*</span>
            </span>
            <input
              type="date"
              {...register("requiredDate")}
              aria-invalid={Boolean(errors.requiredDate)}
              className={getFieldClassName(Boolean(errors.requiredDate))}
            />
            {errors.requiredDate && (
              <p className="text-xs font-medium text-red-600">
                {errors.requiredDate.message}
              </p>
            )}
          </label>

          <label className="grid min-w-0 gap-1.5">
            <span className="text-xs font-semibold text-slate-600">
              Budget Price (Optional, LKR)
            </span>
            <input
              type="number"
              min="0"
              step="1"
              placeholder="e.g., 5000"
              {...register("budgetPrice")}
              aria-invalid={Boolean(errors.budgetPrice)}
              className={getFieldClassName(Boolean(errors.budgetPrice))}
            />
          </label>
        </div>

        <label className="grid min-w-0 gap-1.5">
          <span className="text-xs font-semibold text-slate-600">
            Request Note <span className="text-red-500">*</span>
          </span>
          <textarea
            rows={5}
            {...register("requestNote")}
            placeholder="Describe what service you need, the event/task details, and any deadline."
            aria-invalid={Boolean(errors.requestNote)}
            className={`w-full resize-none rounded-lg border px-3 py-2 text-sm leading-relaxed text-slate-700 outline-none transition placeholder:text-slate-400 focus:ring-4 ${
              errors.requestNote
                ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-100"
                : "border-slate-300 bg-[#f7f8ff] focus:border-[#2f66e7] focus:ring-blue-100"
            }`}
          />
          <p className="text-[11px] font-medium text-slate-500">
            Minimum 10 characters.
          </p>
          {errors.requestNote && (
            <p className="text-xs font-medium text-red-600">
              {errors.requestNote.message}
            </p>
          )}
        </label>

        {/* Submit action */}
        <div className="border-t border-slate-200 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-[#2f66e7] px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-[#2557cf] disabled:opacity-60"
          >
            {isSubmitting ? "Submitting..." : "Submit Request"}
          </button>
        </div>
      </form>

      {invalidModalOpen ? (
        <FormActionModal
          tone="error"
          title="Please fill the required fields"
          description="Service category and required date must be filled before you submit this request."
          primaryLabel="Okay"
          onPrimaryClick={() => setInvalidModalOpen(false)}
          onClose={() => setInvalidModalOpen(false)}
        />
      ) : null}

      {confirmModalOpen ? (
        <FormActionModal
          tone="confirm"
          title="Are you sure?"
          description="Your request details look ready. Submit this service request now?"
          primaryLabel={isSubmitting ? "Submitting..." : "Submit"}
          secondaryLabel="Cancel"
          primaryDisabled={isSubmitting}
          onPrimaryClick={() => void submitConfirmedRequest()}
          onSecondaryClick={() => setConfirmModalOpen(false)}
          onClose={() => setConfirmModalOpen(false)}
        />
      ) : null}
    </section>
  );
}

function FormActionModal({
  tone,
  title,
  description,
  primaryLabel,
  secondaryLabel,
  primaryDisabled = false,
  onPrimaryClick,
  onSecondaryClick,
  onClose,
}: {
  tone: "error" | "confirm";
  title: string;
  description: string;
  primaryLabel: string;
  secondaryLabel?: string;
  primaryDisabled?: boolean;
  onPrimaryClick: () => void;
  onSecondaryClick?: () => void;
  onClose: () => void;
}) {
  const primaryClassName =
    tone === "error"
      ? "bg-red-600 text-white hover:bg-red-700"
      : "bg-[#2f66e7] text-white hover:bg-[#2557cf]";

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/40 px-4 py-6 backdrop-blur-md">
        <div className="w-full max-w-[560px] rounded-2xl border border-slate-200 bg-white p-7 shadow-[0_24px_80px_rgba(15,23,42,0.22)]">
          <div className="flex items-start justify-between gap-5">
            <div className="max-w-[380px]">
              <h3 className="text-[18px] font-bold leading-tight text-slate-900">{title}</h3>
              <p className="mt-3 text-[15px] leading-7 text-slate-600">
                {description}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
              aria-label="Close popup"
            >
              <CloseIcon />
            </button>
          </div>

          <div className="mt-8 flex items-center justify-end gap-3">
            {secondaryLabel ? (
              <button
                type="button"
                onClick={onSecondaryClick}
                className="inline-flex h-11 min-w-[112px] items-center justify-center rounded-lg border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                {secondaryLabel}
              </button>
            ) : null}
            <button
              type="button"
              onClick={onPrimaryClick}
              disabled={primaryDisabled}
              className={`inline-flex h-11 min-w-[112px] items-center justify-center rounded-lg px-5 text-sm font-semibold transition disabled:opacity-60 ${primaryClassName}`}
            >
              {primaryLabel}
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function RecentRequestsPanel({
  buyerId,
  buyerName,
  role,
}: {
  buyerId: string;
  buyerName: string;
  role: Role;
}) {
  const [requests, setRequests] = useState<RequestData[]>([]);
  const [loading, setLoading] = useState(true);

  // Track the request whose review form is currently open.
  const [activeReviewId, setActiveReviewId] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  // Revision notes are kept separate from review feedback.
  const [activeRevisionId, setActiveRevisionId] = useState<string | null>(null);
  const [revisionText, setRevisionText] = useState("");

  const RECENT_REQUEST_LIMIT = 1;

  // The buyer sees provider status changes as soon as Firestore updates.
  useEffect(() => {
    const q = query(
      collection(db, "requests"),
      where("buyerId", "==", buyerId),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs: RequestData[] = [];
        snapshot.forEach((docSnap) => {
          docs.push({ id: docSnap.id, ...docSnap.data() } as RequestData);
        });
        // Sort here because a new server timestamp can briefly be null.
        docs.sort((a, b) => b.id.localeCompare(a.id));
        setRequests(docs);
        setLoading(false);
      },
      (err) => {
        console.error("Error loading recent requests:", err);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [buyerId]);

  const activeRecentRequests = requests.filter(
    (request) =>
      request.status !== "completed" || !Boolean(request.providerReview),
  );
  const displayedRequests = activeRecentRequests.slice(0, RECENT_REQUEST_LIMIT);
  const currentPage = 1;
  const setCurrentPage = (update: number | ((prev: number) => number)) => {
    if (typeof update === "function") {
      update(currentPage);
    }
  };
  const totalPages = 1;
  const allRequestsHref =
    role === "buyer" ? "/request-service/all" : `/request-service/${role}/all`;

  // Accepting delivered work completes the swap and stores the buyer's review.
  const handleAcceptComplete = async (reqId: string) => {
    try {
      const reqObj = requests.find((r) => r.id === reqId);
      await updateDoc(doc(db, "requests", reqId), {
        status: "review_pending",
        updatedAt: serverTimestamp(),
        review: {
          rating: reviewRating,
          comment: reviewComment.trim() || "Outstanding swap session!",
        },
      });

      if (reqObj && reqObj.providerId && reqObj.providerId !== "general") {
        await createNotification({
          userId: reqObj.providerId,
          title: "Swap Completed & Rated",
          description: `${buyerName || "Buyer"} rated your session: ${reviewRating} stars!`,
          type: "review",
          icon: "★",
          tone: "indigo",
        });
      }

      setActiveReviewId(null);
      setReviewComment("");
      setReviewRating(5);
    } catch (err) {
      console.error("Error completing request:", err);
    }
  };

  // A revision returns the request to the provider with clear notes.
  const handleRequestRevision = async (reqId: string) => {
    if (!revisionText.trim()) return;
    try {
      const reqObj = requests.find((r) => r.id === reqId);
      await updateDoc(doc(db, "requests", reqId), {
        status: "revision",
        revisionNotes: revisionText.trim(),
        updatedAt: serverTimestamp(),
      });

      if (reqObj && reqObj.providerId && reqObj.providerId !== "general") {
        await createNotification({
          userId: reqObj.providerId,
          title: "Revision Requested",
          description: `${buyerName || "Buyer"} requested changes for "${reqObj.title}"`,
          type: "request",
          icon: "!",
          tone: "red",
        });
      }

      setActiveRevisionId(null);
      setRevisionText("");
    } catch (err) {
      console.error("Error requesting revision:", err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return {
          label: "Pending Match",
          style: "bg-amber-100 text-amber-800 border-amber-200",
        };
      case "working":
        return {
          label: "In Progress / Working",
          style: "bg-blue-100 text-blue-800 border-blue-200",
        };
      case "done":
        return {
          label: "Marked Done by Provider",
          style:
            "bg-purple-100 text-purple-800 border-purple-200 border-2 animate-pulse",
        };
      case "review_pending":
        return {
          label: "Pending Provider Review",
          style: "bg-amber-100 text-amber-800 border-amber-200",
        };
      case "revision":
        return {
          label: "Revision Sent",
          style: "bg-rose-100 text-rose-800 border-rose-200",
        };
      case "completed":
        return {
          label: "Completed",
          style: "bg-emerald-100 text-emerald-800 border-emerald-200",
        };
      case "rejected":
        return {
          label: "Declined",
          style: "bg-slate-100 text-slate-600 border-slate-200",
        };
      default:
        return {
          label: status,
          style: "bg-slate-100 text-slate-600 border-slate-200",
        };
    }
  };

  if (loading) {
    return (
      <aside className="min-w-0">
        <h2 className="text-2xl font-semibold text-slate-900">
          Recent Requests
        </h2>
        <div className="mt-4 flex items-center justify-center p-6 text-sm text-slate-500">
          Loading requests...
        </div>
      </aside>
    );
  }

  return (
    <aside className="min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold text-slate-900">
          Recent Requests
        </h2>
        {requests.length > 0 && (
          <Link
            href={allRequestsHref}
            className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-xs font-bold text-[#2f66e7] shadow-sm transition-colors hover:bg-slate-50"
          >
            View All Requests ({requests.length}) →
          </Link>
        )}
      </div>

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

                  <span
                    className={`inline-block self-start rounded-lg border px-3 py-1 text-xs font-semibold ${badge.style}`}
                  >
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
                    <strong className="block font-bold">
                      Your Revision Notes:
                    </strong>
                    &ldquo;{item.revisionNotes}&rdquo;
                  </div>
                )}

                {/* Buyer decision for delivered work */}
                {item.status === "done" &&
                  !activeReviewId &&
                  !activeRevisionId && (
                    <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-3">
                      <p className="text-xs font-semibold text-slate-500">
                        Provider finished! Check the work:
                      </p>
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

                {/* Completion review form */}
                {activeReviewId === item.id && (
                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/40 p-3.5 transition">
                    <p className="text-xs font-bold text-slate-800">
                      Rate Provider Session:
                    </p>
                    <div className="flex gap-1.5 mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => setReviewRating(star)}
                          className={`text-2xl transition ${
                            reviewRating >= star
                              ? "text-amber-500 scale-110"
                              : "text-slate-300"
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

                {/* Revision request form */}
                {activeRevisionId === item.id && (
                  <div className="mt-4 rounded-xl border border-red-200 bg-red-50/40 p-3.5 transition">
                    <p className="text-xs font-bold text-slate-800">
                      Describe the changes needed:
                    </p>
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

                {/* Completed swap details */}
                {(item.status === "completed" ||
                  item.status === "review_pending") && (
                  <div className="mt-3 space-y-2">
                    {item.review && (
                      <div className="rounded-lg bg-emerald-50/50 border border-emerald-100 p-2.5 text-xs text-emerald-800">
                        <span className="font-bold block">
                          ✓ Your Review of Provider:
                        </span>
                        <span className="text-amber-600 font-bold">
                          {"★".repeat(item.review.rating)}
                          {"☆".repeat(5 - item.review.rating)}
                        </span>
                        <p className="italic mt-0.5">
                          &ldquo;{item.review.comment}&rdquo;
                        </p>
                      </div>
                    )}

                    {item.providerReview ? (
                      <div className="rounded-lg bg-blue-50/60 border border-blue-100 p-2.5 text-xs text-blue-800">
                        <span className="font-bold block">
                          ★ {"Provider's Review of You"}:
                        </span>
                        <span className="text-blue-500 font-bold">
                          {"★".repeat(item.providerReview.rating)}
                          {"☆".repeat(5 - item.providerReview.rating)}
                        </span>
                        <p className="italic mt-0.5">
                          &ldquo;{item.providerReview.comment}&rdquo;
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-lg bg-slate-50 border border-slate-200/60 p-2.5 text-xs text-slate-500 italic">
                        {
                          "Awaiting Provider's feedback before this moves to completed."
                        }
                      </div>
                    )}
                  </div>
                )}

                {item.status === "working" && (
                  <div className="mt-4 border-t border-slate-100 pt-3">
                    <Link
                      href={`${scopedHref("/chats", role)}?peerId=${encodeURIComponent(item.providerId)}&subject=${encodeURIComponent(item.title)}`}
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
            {requests.length > 0
              ? "Your active request is complete. Older requests are available in My Requests."
              : "You have not submitted any swap requests yet."}
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
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
            className="inline-flex h-8 items-center justify-center rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-bold text-slate-700 shadow-xs transition hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed select-none"
          >
            Next →
          </button>
        </div>
      )}

    </aside>
  );
}

const fieldClassName =
  "h-10 w-full rounded-lg border border-slate-300 bg-[#f7f8ff] px-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#2f66e7] focus:ring-4 focus:ring-blue-100";

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function ChatIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M4 5h16v11H7l-3 3z" />
    </svg>
  );
}

