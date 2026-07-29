"use client";

import Link from "next/link";
import { useState, useEffect, type ReactNode } from "react";
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
    <div className="flex w-full flex-col gap-6 pb-10">
      <section className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-[linear-gradient(135deg,rgba(238,244,255,0.98),rgba(255,255,255,0.94),rgba(232,245,255,0.98))] shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <div className="grid gap-6 px-6 py-6 sm:px-8 sm:py-8 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-end">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-700 shadow-sm">
              <SparkIcon className="h-3.5 w-3.5" />
              Buyer Workspace
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-[2.2rem]">
              Request a service with a cleaner, faster workflow
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-[15px]">
              Post a public request, share your budget and deadline, and keep recent requests neatly organized in one place so providers can respond quickly.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <InfoTile
              icon={<LayersIcon className="h-4 w-4" />}
              label="Structured form"
              value="Category, date, budget, and notes are grouped for quick scanning."
            />
            <InfoTile
              icon={<PulseIcon className="h-4 w-4" />}
              label="Recent activity"
              value="Track the latest provider updates and review actions from one panel."
            />
          </div>
        </div>
      </section>

      <section className="grid items-start gap-6 2xl:grid-cols-[minmax(0,1fr)_380px]">
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

      if (providerId && providerId !== "general") {
        await createNotification({
          userId: providerId,
          title: "New Service Request",
          description: `${buyerProfile.name} requested "${title}"`,
          type: "request",
          icon: "♦",
          tone: "blue",
        });
      }

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
    <section className="overflow-hidden rounded-[26px] border border-slate-200/80 bg-white shadow-[0_18px_56px_rgba(15,23,42,0.06)]">
      <div className="border-b border-slate-200/80 bg-[linear-gradient(180deg,#ffffff,rgba(245,248,255,0.96))] px-5 py-5 sm:px-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-950">
              New Service Request
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Fill in the details below. Only the interface has changed, your request flow stays the same.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 self-start rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm">
            <ShieldIcon className="h-3.5 w-3.5 text-blue-600" />
            Visible to verified providers
          </div>
        </div>
      </div>

      <div className="px-5 py-5 sm:px-7 sm:py-6">
        <form
          onSubmit={handleSubmit(onSubmit, onInvalidSubmit)}
          noValidate
          className="grid gap-5"
        >
          {feedback && (
            <div
              className={`rounded-2xl border px-4 py-3 text-sm font-semibold shadow-sm ${
                feedback.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-red-200 bg-red-50 text-red-800"
              }`}
            >
              {feedback.msg}
            </div>
          )}

          <div className="grid gap-5 rounded-[24px] border border-slate-200/80 bg-slate-50/55 p-4 sm:p-5">
            <div className="grid gap-5">
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
                className="min-h-12 rounded-xl border-slate-200 bg-white px-4 text-sm shadow-sm"
                labelClassName="text-[12px] uppercase tracking-[0.14em] text-slate-500"
                error={errors.category?.message}
              />

              <div className="grid gap-4 lg:grid-cols-2">
                <label className="grid min-w-0 gap-2">
                  <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-500">
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

                <label className="grid min-w-0 gap-2">
                  <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-500">
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
            </div>

            <label className="grid min-w-0 gap-2">
              <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Request Note <span className="text-red-500">*</span>
              </span>
              <textarea
                rows={6}
                {...register("requestNote")}
                placeholder="Describe what service you need, the event/task details, and any deadline."
                aria-invalid={Boolean(errors.requestNote)}
                className={`w-full resize-none rounded-2xl border px-4 py-3 text-sm leading-7 text-slate-700 outline-none transition placeholder:text-slate-400 focus:ring-4 ${
                  errors.requestNote
                    ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-100"
                    : "border-slate-200 bg-white shadow-sm focus:border-[#2f66e7] focus:ring-blue-100"
                }`}
              />
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-medium text-slate-500">
                <p>Minimum 10 characters.</p>
                <p>Tip: include the scope, expected output, and deadline.</p>
              </div>
              {errors.requestNote && (
                <p className="text-xs font-medium text-red-600">
                  {errors.requestNote.message}
                </p>
              )}
            </label>
          </div>

          <div className="flex flex-col gap-3 rounded-[22px] border border-slate-200/80 bg-slate-50/55 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Ready to publish?
              </p>
              <p className="mt-1 text-xs leading-6 text-slate-500">
                Providers will be able to review the request after you submit it.
              </p>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#2f66e7] px-6 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(47,102,231,0.28)] transition hover:bg-[#2557cf] disabled:opacity-60 sm:w-auto sm:min-w-[220px]"
            >
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </form>
      </div>

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
  const [activeReviewId, setActiveReviewId] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [activeRevisionId, setActiveRevisionId] = useState<string | null>(null);
  const [revisionText, setRevisionText] = useState("");

  const RECENT_REQUEST_LIMIT = 1;

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

  const handleAcceptComplete = async (reqId: string) => {
    try {
      const reqObj = requests.find((r) => r.id === reqId);
      await updateDoc(doc(db, "requests", reqId), {
        status: "review_pending",
        buyerReviewedAt: serverTimestamp(),
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
          style: "border-amber-200 bg-amber-100 text-amber-800",
        };
      case "working":
        return {
          label: "In Progress / Working",
          style: "border-blue-200 bg-blue-100 text-blue-800",
        };
      case "done":
        return {
          label: "Marked Done by Provider",
          style: "border-purple-200 bg-purple-100 text-purple-800",
        };
      case "review_pending":
        return {
          label: "Pending Provider Review",
          style: "border-amber-200 bg-amber-100 text-amber-800",
        };
      case "revision":
        return {
          label: "Revision Sent",
          style: "border-rose-200 bg-rose-100 text-rose-800",
        };
      case "completed":
        return {
          label: "Completed",
          style: "border-emerald-200 bg-emerald-100 text-emerald-800",
        };
      case "rejected":
        return {
          label: "Declined",
          style: "border-slate-200 bg-slate-100 text-slate-600",
        };
      default:
        return {
          label: status,
          style: "border-slate-200 bg-slate-100 text-slate-600",
        };
    }
  };

  if (loading) {
    return (
      <aside className="min-w-0 rounded-[26px] border border-slate-200/80 bg-white p-5 shadow-[0_18px_56px_rgba(15,23,42,0.06)] 2xl:sticky 2xl:top-6">
        <h2 className="text-xl font-bold tracking-tight text-slate-950">
          Recent Requests
        </h2>
        <div className="mt-5 flex min-h-[220px] items-center justify-center rounded-[20px] border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
          Loading requests...
        </div>
      </aside>
    );
  }

  return (
    <aside className="min-w-0 rounded-[26px] border border-slate-200/80 bg-white p-5 shadow-[0_18px_56px_rgba(15,23,42,0.06)] 2xl:sticky 2xl:top-6">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200/80 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-950">
            Recent Requests
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Keep track of provider progress and next actions.
          </p>
        </div>
        {requests.length > 0 && (
          <div className="rounded-2xl border border-blue-100 bg-blue-50/70 px-3 py-2 text-right">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-700">
              Active total
            </p>
            <p className="text-lg font-bold text-blue-900">{requests.length}</p>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
          Latest request status
        </p>
        {requests.length > 0 && (
          <Link
            href={allRequestsHref}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 text-xs font-bold text-[#2f66e7] shadow-sm transition-colors hover:bg-white"
          >
            View All Requests ({requests.length}) →
          </Link>
        )}
      </div>

      <div className="scrollbar-none mt-4 grid max-h-[720px] gap-4 overflow-y-auto pr-1">
        {displayedRequests.length > 0 ? (
          displayedRequests.map((item) => {
            const badge = getStatusBadge(item.status);
            return (
              <article
                key={item.id}
                className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-[linear-gradient(180deg,#ffffff,rgba(248,250,255,0.96))] shadow-[0_14px_36px_rgba(15,23,42,0.06)]"
              >
                <div className="border-b border-slate-200/70 px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span className="inline-flex max-w-full items-center rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                        <span className="truncate">{item.category}</span>
                      </span>
                      <h3 className="mt-3 text-xl font-bold leading-tight text-slate-950">
                        {item.title}
                      </h3>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-right shadow-sm">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                        Provider
                      </p>
                      <p className="text-xs font-semibold text-slate-600">
                        {item.providerName.split(" ")[0]}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${badge.style}`}
                    >
                      {badge.label}
                    </span>
                    {item.budget ? (
                      <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                        {item.budget}
                      </span>
                    ) : null}
                    {item.time ? (
                      <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                        Due: {item.time}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="px-5 py-4">
                  <p className="text-sm leading-7 text-slate-600 line-clamp-4">
                    {item.description}
                  </p>

                  {item.status === "revision" && item.revisionNotes && (
                    <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs leading-6 text-rose-700">
                      <strong className="block font-bold">
                        Your Revision Notes
                      </strong>
                      <span>&ldquo;{item.revisionNotes}&rdquo;</span>
                    </div>
                  )}

                  {item.status === "done" &&
                    !activeReviewId &&
                    !activeRevisionId && (
                      <div className="mt-5 rounded-[20px] border border-emerald-100 bg-emerald-50/60 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
                          Action required
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          Provider finished the work. Review it and choose the next step.
                        </p>
                        <div className="mt-4 grid gap-2 sm:grid-cols-2">
                          <button
                            onClick={() => setActiveReviewId(item.id)}
                            className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
                          >
                            ✓ Accept & Complete
                          </button>
                          <button
                            onClick={() => setActiveRevisionId(item.id)}
                            className="rounded-xl border border-red-300 bg-white px-4 py-3 text-sm font-bold text-red-700 transition hover:bg-red-50"
                          >
                            Request Revision
                          </button>
                        </div>
                      </div>
                    )}

                  {activeReviewId === item.id && (
                    <div className="mt-5 rounded-[20px] border border-amber-200 bg-amber-50/50 p-4 transition">
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-amber-800">
                        Rate Provider Session
                      </p>
                      <div className="mt-2 flex gap-1.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            type="button"
                            key={star}
                            onClick={() => setReviewRating(star)}
                            className={`text-2xl transition ${
                              reviewRating >= star
                                ? "scale-110 text-amber-500"
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
                        className="mt-3 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700 outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
                        rows={3}
                      />
                      <div className="mt-3 flex justify-end gap-2">
                        <button
                          onClick={() => setActiveReviewId(null)}
                          className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-500"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleAcceptComplete(item.id)}
                          className="rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700"
                        >
                          Submit & Complete
                        </button>
                      </div>
                    </div>
                  )}

                  {activeRevisionId === item.id && (
                    <div className="mt-5 rounded-[20px] border border-red-200 bg-red-50/50 p-4 transition">
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-red-700">
                        Describe the changes needed
                      </p>
                      <textarea
                        placeholder="List what needs to be fixed or updated by the provider..."
                        value={revisionText}
                        onChange={(e) => setRevisionText(e.target.value)}
                        className="mt-3 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700 outline-none focus:border-red-400 focus:ring-4 focus:ring-red-100"
                        rows={3}
                      />
                      <div className="mt-3 flex justify-end gap-2">
                        <button
                          onClick={() => setActiveRevisionId(null)}
                          className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-500"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleRequestRevision(item.id)}
                          disabled={!revisionText.trim()}
                          className="rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-50"
                        >
                          Send to Provider
                        </button>
                      </div>
                    </div>
                  )}

                  {(item.status === "completed" ||
                    item.status === "review_pending") && (
                    <div className="mt-4 space-y-3">
                      {item.review && (
                        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-3 text-xs text-emerald-800">
                          <span className="block font-bold">
                            ✓ Your Review of Provider
                          </span>
                          <span className="font-bold text-amber-600">
                            {"★".repeat(item.review.rating)}
                            {"☆".repeat(5 - item.review.rating)}
                          </span>
                          <p className="mt-1 italic">
                            &ldquo;{item.review.comment}&rdquo;
                          </p>
                        </div>
                      )}

                      {item.providerReview ? (
                        <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-3 text-xs text-blue-800">
                          <span className="block font-bold">
                            ★ Provider&apos;s Review of You
                          </span>
                          <span className="font-bold text-blue-500">
                            {"★".repeat(item.providerReview.rating)}
                            {"☆".repeat(5 - item.providerReview.rating)}
                          </span>
                          <p className="mt-1 italic">
                            &ldquo;{item.providerReview.comment}&rdquo;
                          </p>
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-3 text-xs italic text-slate-500">
                          Awaiting provider feedback before this moves to completed.
                        </div>
                      )}
                    </div>
                  )}

                  {item.status === "working" && (
                    <div className="mt-5 border-t border-slate-200/80 pt-4">
                      <Link
                        href={`${scopedHref("/chats", role)}?peerId=${encodeURIComponent(item.providerId)}&subject=${encodeURIComponent(item.title)}`}
                        className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
                      >
                        <ChatIcon className="mr-2 h-4 w-4" />
                        Open Session Chat
                      </Link>
                    </div>
                  )}
                </div>
              </article>
            );
          })
        ) : (
          <div className="rounded-[22px] border border-dashed border-slate-200 bg-slate-50/60 p-8 text-center text-sm leading-7 text-slate-500">
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
            className="inline-flex h-8 items-center justify-center rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 select-none"
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
                      ? "bg-[#2f66e7] text-white"
                      : "border border-transparent text-slate-500 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-800"
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
            className="inline-flex h-8 items-center justify-center rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 select-none"
          >
            Next →
          </button>
        </div>
      )}
    </aside>
  );
}

const fieldClassName =
  "h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#2f66e7] focus:ring-4 focus:ring-blue-100";

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

function InfoTile({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[22px] border border-white/80 bg-white/80 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur">
      <div className="flex items-center gap-2 text-blue-700">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50">
          {icon}
        </span>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          {label}
        </p>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600">{value}</p>
    </div>
  );
}

function SparkIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 3 1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8Z" />
      <path d="M19 4v3" />
      <path d="M20.5 5.5h-3" />
    </svg>
  );
}

function LayersIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 4 8 4-8 4-8-4 8-4Z" />
      <path d="m4 12 8 4 8-4" />
      <path d="m4 16 8 4 8-4" />
    </svg>
  );
}

function PulseIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12h4l2-5 4 10 2-5h6" />
    </svg>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3.5 6 6v5.7c0 3.8 2.3 7.3 6 8.8 3.7-1.5 6-5 6-8.8V6l-6-2.5Z" />
      <path d="m9.5 12 1.7 1.7 3.3-3.6" />
    </svg>
  );
}
