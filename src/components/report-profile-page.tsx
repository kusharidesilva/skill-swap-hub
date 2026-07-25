"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type ReactNode,
} from "react";
import { useAuth } from "@/context/AuthContext";
import { db, storage } from "@/lib/firebase";
import { ISSUE_TYPES } from "@/lib/platform";
import SelectField from "@/components/ui/select-field";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

type ReportProfilePageProps = {
  providerId?: string;
};

type UserOption = {
  id: string;
  name: string;
};

type CompletedExchangeDoc = {
  buyerId?: string;
  buyerUserId?: string;
  buyerName?: string;
  providerId?: string;
  providerName?: string;
  status?: string;
  orderStatus?: string;
};

type ReportHistoryItem = {
  id: string;
  targetName: string;
  category: string;
  status: string;
  createdAtMs: number;
};

const REPORT_TYPES = new Set(["profile", "issue", "safety"]);
const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024;
const ALLOWED_FILE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
]);

export default function ReportProfilePage({ providerId }: ReportProfilePageProps) {
  const { userProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [targetUserId, setTargetUserId] = useState(providerId ?? "");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [isAgreed, setIsAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const [isLoadingTargets, setIsLoadingTargets] = useState(true);
  const [didAttemptSubmit, setDidAttemptSubmit] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);
  const [usersList, setUsersList] = useState<UserOption[]>([]);
  const [historyRows, setHistoryRows] = useState<ReportHistoryItem[]>([]);
  const [lockedTargetName, setLockedTargetName] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [issueTypeOptions, setIssueTypeOptions] = useState<string[]>([...ISSUE_TYPES]);

  useEffect(() => {
    let active = true;

    // Only users from completed swaps are valid report targets.
    async function loadCompletedSwapUsers() {
      if (!userProfile) {
        if (active) {
          setUsersList([]);
          setIsLoadingTargets(false);
        }
        return;
      }

      try {
        const [
          buyerSnapshot,
          providerSnapshot,
          buyerOrdersSnapshot,
          providerOrdersSnapshot,
        ] = await Promise.all([
          getDocs(
            query(
              collection(db, "requests"),
              where("buyerId", "==", userProfile.uid),
              where("status", "==", "completed")
            )
          ),
          getDocs(
            query(
              collection(db, "requests"),
              where("providerId", "==", userProfile.uid),
              where("status", "==", "completed")
            )
          ),
          getDocs(
            query(
              collection(db, "serviceOrders"),
              where("buyerUserId", "==", userProfile.uid),
            )
          ),
          getDocs(
            query(
              collection(db, "serviceOrders"),
              where("providerId", "==", userProfile.uid),
            )
          ),
        ]);

        if (!active) {
          return;
        }

        // A map removes duplicates when the same person appears in both request roles.
        const reportableUsers = new Map<string, UserOption>();

        const addCompletedPartner = (
          data: CompletedExchangeDoc,
          perspective: "buyer" | "provider",
        ) => {
          if ("orderStatus" in data || "status" in data) {
            const normalizedStatus = normalizeStatus(data.orderStatus || data.status || "");
            if (normalizedStatus !== "completed") {
              return;
            }
          }

          const partnerId =
            perspective === "buyer"
              ? typeof data.providerId === "string"
                ? data.providerId
                : ""
              : typeof data.buyerId === "string"
                ? data.buyerId
                : typeof data.buyerUserId === "string"
                  ? data.buyerUserId
                  : "";
          const partnerName =
            perspective === "buyer"
              ? typeof data.providerName === "string" && data.providerName.trim()
                ? data.providerName
                : "Community Member"
              : typeof data.buyerName === "string" && data.buyerName.trim()
                ? data.buyerName
                : "Community Member";

          if (
            !partnerId ||
            partnerId === "general" ||
            partnerId === userProfile.uid ||
            reportableUsers.has(partnerId)
          ) {
            return;
          }

          reportableUsers.set(partnerId, {
            id: partnerId,
            name: partnerName,
          });
        };

        buyerSnapshot.forEach((entry) => {
          addCompletedPartner(entry.data() as CompletedExchangeDoc, "buyer");
        });

        providerSnapshot.forEach((entry) => {
          addCompletedPartner(entry.data() as CompletedExchangeDoc, "provider");
        });

        buyerOrdersSnapshot.forEach((entry) => {
          addCompletedPartner(entry.data() as CompletedExchangeDoc, "buyer");
        });

        providerOrdersSnapshot.forEach((entry) => {
          addCompletedPartner(entry.data() as CompletedExchangeDoc, "provider");
        });

        const nextUsers = Array.from(reportableUsers.values()).sort((left, right) =>
          left.name.localeCompare(right.name)
        );
        setUsersList(nextUsers);
      } catch (error) {
        console.error("Error fetching completed swap users:", error);
      } finally {
        if (active) {
          setIsLoadingTargets(false);
        }
      }
    }

    loadCompletedSwapUsers();

    return () => {
      active = false;
    };
  }, [userProfile]);

  useEffect(() => {
    let active = true;

    // A report opened from a profile locks the target but still resolves their name.
    async function loadLockedTarget() {
      if (!providerId) {
        setLockedTargetName("");
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", providerId));
        if (!active) {
          return;
        }

        if (!userDoc.exists()) {
          setLockedTargetName(providerId);
          return;
        }

        const data = userDoc.data();
        setLockedTargetName(
          typeof data.name === "string" && data.name.trim() ? data.name : providerId
        );
      } catch (error) {
        if (!active) {
          return;
        }
        console.error("Error fetching report target:", error);
        setLockedTargetName(providerId);
      }
    }

    loadLockedTarget();

    return () => {
      active = false;
    };
  }, [providerId]);

  useEffect(() => {
    if (!userProfile) {
      return;
    }

    const unsubscribe = onSnapshot(
      collection(db, "issueTypes"),
      (snapshot) => {
        const nextOptions = snapshot.docs
          .map((entry) => {
            const data = entry.data();
            return {
              name: typeof data.name === "string" ? data.name.trim() : "",
              active: data.active !== false,
            };
          })
          .filter((item) => item.active && item.name)
          .map((item) => item.name)
          .sort((left, right) => left.localeCompare(right));

        setIssueTypeOptions(nextOptions.length ? nextOptions : [...ISSUE_TYPES]);
      },
      (error) => {
        console.error("Error fetching issue types:", error);
        setIssueTypeOptions([...ISSUE_TYPES]);
      },
    );

    return () => unsubscribe();
  }, [userProfile]);

  useEffect(() => {
    if (!userProfile) {
      return;
    }

    // Live history lets the reporter see new moderation status changes.
    const reportsQuery = query(collection(db, "reports"), where("reporterId", "==", userProfile.uid));

    const unsubscribe = onSnapshot(
      reportsQuery,
      (snapshot) => {
        const items: ReportHistoryItem[] = [];

        snapshot.forEach((entry) => {
          const data = entry.data();
          if (!REPORT_TYPES.has(String(data.type ?? ""))) {
            return;
          }

          items.push({
            id: entry.id,
            targetName:
              typeof data.targetUserName === "string" && data.targetUserName.trim()
                ? data.targetUserName
                : "Community Member",
            category:
              typeof data.issueType === "string" && data.issueType.trim()
                ? data.issueType
                : typeof data.category === "string" && data.category.trim()
                  ? data.category
                : "General Review",
            status:
              typeof data.status === "string" && data.status.trim() ? data.status : "Pending",
            createdAtMs:
              typeof data.createdAt?.toMillis === "function" ? data.createdAt.toMillis() : 0,
          });
        });

        items.sort((left, right) => right.createdAtMs - left.createdAtMs);
        setHistoryRows(items);
      },
      (error) => {
        console.error("Error fetching reports history:", error);
      }
    );

    return () => unsubscribe();
  }, [userProfile]);

  // Validation flags are also reused by the form to highlight individual fields.
  const selectedTarget = usersList.find((user) => user.id === targetUserId);
  const targetName = selectedTarget?.name || lockedTargetName;
  const isLockedTarget = Boolean(providerId);
  const hasEligibleTargets = usersList.length > 0;
  const targetIsEligible = usersList.some((user) => user.id === targetUserId);
  const canChooseIssueType = isLockedTarget ? targetIsEligible : hasEligibleTargets;
  const isTargetInvalid = didAttemptSubmit && (!targetUserId || !targetIsEligible);
  const isCategoryInvalid = didAttemptSubmit && !category;
  const isDescriptionInvalid = didAttemptSubmit && description.trim().length < 10;
  const isAgreementInvalid = didAttemptSubmit && !isAgreed;

  useEffect(() => {
    if (canChooseIssueType) {
      return;
    }

    setCategory("");
  }, [canChooseIssueType]);

  const handleFiles = (incomingFiles: FileList | File[]) => {
    const nextFiles = Array.from(incomingFiles);

    if (nextFiles.length === 0) {
      return;
    }

    // Validate before upload and cap the final evidence list at five files.
    const invalidFile = nextFiles.find(
      (file) => !ALLOWED_FILE_TYPES.has(file.type) || file.size > MAX_FILE_SIZE_BYTES
    );

    if (invalidFile) {
      setFeedback({
        type: "error",
        msg: "Only PNG, JPG, WEBP, or PDF files up to 2MB are allowed.",
      });
      return;
    }

    setSelectedFiles((currentFiles) => {
      const uniqueFiles = new Map<string, File>();
      [...currentFiles, ...nextFiles].forEach((file) => {
        uniqueFiles.set(`${file.name}-${file.size}-${file.lastModified}`, file);
      });
      return Array.from(uniqueFiles.values()).slice(0, 5);
    });
    setFeedback(null);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      handleFiles(event.target.files);
    }
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingFiles(false);
    handleFiles(event.dataTransfer.files);
  };

  const removeSelectedFile = (fileKey: string) => {
    setSelectedFiles((currentFiles) =>
      currentFiles.filter((file) => `${file.name}-${file.size}-${file.lastModified}` !== fileKey)
    );
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setDidAttemptSubmit(true);

    if (!userProfile) {
      return;
    }

    if (!targetUserId) {
      setFeedback({ type: "error", msg: "Please select the user you want to report." });
      return;
    }

    if (isLoadingTargets) {
      setFeedback({
        type: "error",
        msg: "Please wait until your completed swap users finish loading.",
      });
      return;
    }

    if (!isLockedTarget && !hasEligibleTargets) {
      setFeedback({
        type: "error",
        msg: "You can only report users after a completed swap with them.",
      });
      return;
    }

    // The client repeats the completed-swap rule before any evidence is uploaded.
    if (!targetIsEligible) {
      setFeedback({
        type: "error",
        msg: "You can only report users with whom you have completed a swap.",
      });
      return;
    }

    if (!category) {
      setFeedback({ type: "error", msg: "Please choose a report category." });
      return;
    }

    if (description.trim().length < 10) {
      setFeedback({
        type: "error",
        msg: "Please provide at least 10 characters so the moderation team can review it properly.",
      });
      return;
    }

    if (!isAgreed) {
      setFeedback({
        type: "error",
        msg: "Please confirm that the information you provided is accurate.",
      });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      // Upload evidence first so the report stores permanent download URLs.
      const uploadedEvidence = await Promise.all(
        selectedFiles.map(async (file) => {
          const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
          const storageRef = ref(
            storage,
            `reports/${userProfile.uid}/${Date.now()}-${safeFileName}`
          );
          await uploadBytes(storageRef, file, { contentType: file.type });
          const downloadUrl = await getDownloadURL(storageRef);

          return {
            name: file.name,
            size: file.size,
            type: file.type,
            url: downloadUrl,
          };
        })
      );

      await addDoc(collection(db, "reports"), {
        type: "profile",
        reportSource: providerId ? "report-issue-targeted" : "report-issue-general",
        reporterId: userProfile.uid,
        reporterName: userProfile.name || "Reporter",
        reporterEmail: userProfile.email || "",
        targetUserId,
        targetUserName: targetName || "Community Member",
        category,
        issueType: category,
        description: description.trim(),
        evidenceFiles: uploadedEvidence,
        status: "Pending",
        createdAt: serverTimestamp(),
      });

      setFeedback({
        type: "success",
        msg: "Your report has been submitted successfully. Trust & Safety will review it soon.",
      });
      setCategory("");
      setDescription("");
      setIsAgreed(false);
      setSelectedFiles([]);
      setDidAttemptSubmit(false);

      if (!providerId) {
        setTargetUserId("");
      }
    } catch (error) {
      console.error("Error submitting report:", error);
      setFeedback({
        type: "error",
        msg: "We could not submit your report right now. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex w-full flex-col gap-8 pb-8">
      {/* Trust and safety introduction */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-[700px] pt-1">
          <h1 className="text-[30px] font-semibold leading-[1.15] tracking-[-0.03em] text-[#24324b]">
            Trust &amp; Safety Center
          </h1>
          <p className="mt-3 max-w-[720px] text-[15px] leading-[1.7] text-[#6c7a96]">
            We are committed to maintaining a high-quality community. If you encounter any
            issues during an exchange or with another user, please let us know immediately.
          </p>
        </div>

        <section className="flex w-full max-w-[292px] items-start gap-4 rounded-2xl border border-[#c8f0ea] bg-[#edfcf8] px-4 py-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#22b8aa] text-white">
            <ShieldIcon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[15px] font-semibold leading-5 text-[#185e60]">
              Community Protection
            </p>
            <p className="mt-1 text-[13px] leading-5 text-[#317d7b]">
              All reports are strictly confidential.
            </p>
          </div>
        </section>
      </div>

      {/* Report form and guidance */}
      <div className="grid gap-8 xl:grid-cols-[minmax(0,620px)_minmax(0,438px)]">
        <section className="overflow-hidden rounded-[18px] border border-[#dbe2ef] bg-white shadow-[0_2px_8px_rgba(33,42,62,0.04)]">
          <div className="flex items-center gap-3 border-b border-[#dbe2ef] bg-[#f8fbff] px-6 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ffe4ea] text-[#ef295a]">
              <AlertIcon className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-[#24324b]">Report a Problem</h2>
              <p className="text-[12px] leading-5 text-[#7c8aa4]">
                Provide as much detail as possible.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-7 px-6 py-6">
            {feedback ? (
              <div
                className={`rounded-xl border px-4 py-3 text-[12px] ${
                  feedback.type === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-rose-200 bg-rose-50 text-rose-700"
                }`}
              >
                {feedback.msg}
              </div>
            ) : null}

            <div>
              <p className="mb-3 text-[14px] font-semibold text-[#42516b]">
                Who are you reporting?
              </p>
              {isLockedTarget ? (
                <input
                  type="text"
                  value={targetName || "Loading user..."}
                  readOnly
                  className={`h-10 w-full rounded-[10px] px-4 text-[14px] outline-none ${
                    isTargetInvalid
                      ? "border border-red-300 bg-red-50 text-red-700"
                      : "border border-[#d7dfec] bg-[#f8fafc] text-[#4f5f79]"
                  }`}
                />
              ) : (
                <SelectField
                  label="Who are you reporting?"
                  value={targetUserId}
                  onChange={(nextValue) => {
                    setTargetUserId(nextValue);
                    setFeedback(null);
                  }}
                  placeholder={
                    isLoadingTargets
                      ? "Loading users..."
                      : hasEligibleTargets
                        ? "Select a user"
                        : "No completed swaps yet"
                  }
                  options={usersList.map((user) => ({
                    value: user.id,
                    label: user.name,
                  }))}
                  disabled={isLoadingTargets || !hasEligibleTargets}
                  error={isTargetInvalid ? "Please select a valid user from your completed swaps." : undefined}
                  className={inputClassName}
                  labelClassName="hidden"
                />
              )}

              {!isLockedTarget ? (
                <p className="mt-2 text-[12px] leading-5 text-[#97a3b7]">
                  Only users from your completed swaps are shown here.
                </p>
              ) : null}
              {isTargetInvalid ? (
                <p className="mt-2 text-[12px] text-red-500">
                  Please select a valid user from your completed swaps.
                </p>
              ) : null}
            </div>

            <div>
              <p className="mb-3 text-[14px] font-semibold text-[#42516b]">
                Issue Type
              </p>
              <SelectField
                label="Issue Type"
                value={category}
                onChange={(nextValue) => {
                  setCategory(nextValue);
                  setFeedback(null);
                }}
                placeholder="Choose an issue type"
                options={issueTypeOptions}
                disabled={!canChooseIssueType}
                error={isCategoryInvalid ? "Please choose a report category." : undefined}
                className={inputClassName}
                labelClassName="hidden"
                helperText={
                  canChooseIssueType
                    ? undefined
                    : "Complete a swap with the user first to choose an issue type."
                }
              />
            </div>

            <Field label="Detailed Description">
              <textarea
                rows={6}
                value={description}
                onChange={(event) => {
                  setDescription(event.target.value);
                  setFeedback(null);
                }}
                placeholder="Explain what happened in detail..."
                aria-invalid={isDescriptionInvalid}
                className={`min-h-[136px] w-full resize-none rounded-[10px] px-4 py-3.5 text-[14px] leading-6 text-[#38475f] outline-none transition placeholder:text-[#9aa6ba] focus:border-[#2f66e7] focus:ring-4 focus:ring-[#dbe7ff] ${
                  isDescriptionInvalid
                    ? "border border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-100"
                    : "border border-[#d7dfec]"
                }`}
              />
              <p className={`mt-2 text-[12px] ${isDescriptionInvalid ? "text-red-500" : "text-slate-400"}`}>
                Minimum 10 characters requested for priority review.
              </p>
            </Field>

            <Field label="Supporting Evidence">
              <div
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDraggingFiles(true);
                }}
                onDragLeave={() => setIsDraggingFiles(false)}
                onDrop={handleDrop}
                className={`rounded-[14px] border border-dashed px-6 py-10 text-center transition ${
                  isDraggingFiles
                    ? "border-[#7aa8ff] bg-[#f4f8ff]"
                    : "border-[#d8e0ee] bg-[#fbfdff]"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".png,.jpg,.jpeg,.webp,.pdf"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm">
                  <UploadIcon className="h-5 w-5" />
                </div>
                <p className="mt-5 text-[14px] text-[#58677f]">
                  Drag &amp; drop files or{" "}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="font-semibold text-[#2563eb] underline"
                  >
                    click to browse
                  </button>
                </p>
                <p className="mt-1 text-[12px] text-slate-400">
                  Screenshots, PDFs, or relevant chat logs (Max 2MB)
                </p>
              </div>

              {selectedFiles.length > 0 ? (
                <div className="mt-3 space-y-2">
                  {selectedFiles.map((file) => {
                    const fileKey = `${file.name}-${file.size}-${file.lastModified}`;

                    return (
                      <div
                        key={fileKey}
                        className="flex items-center justify-between rounded-[10px] border border-[#e2e8f3] bg-[#f8fbff] px-3 py-2.5"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-medium text-[#334155]">
                            {file.name}
                          </p>
                          <p className="text-[11px] text-[#93a1b5]">
                            {formatBytes(file.size)} - {file.type === "application/pdf" ? "PDF" : "Image"}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeSelectedFile(fileKey)}
                          className="text-[12px] font-semibold text-[#ef295a]"
                        >
                          Remove
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </Field>

            <div className="border-t border-[#e4e9f2] pt-6">
              <label
                className={`flex max-w-[250px] cursor-pointer items-start gap-3 text-[13px] leading-7 ${
                  isAgreementInvalid ? "text-red-500" : "text-[#7b889d]"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isAgreed}
                  onChange={(event) => {
                    setIsAgreed(event.target.checked);
                    setFeedback(null);
                  }}
                  className={`mt-1 h-[18px] w-[18px] rounded-[5px] text-[#ef295a] ${
                    isAgreementInvalid ? "border-red-400" : "border-slate-300"
                  }`}
                />
                I verify this information is accurate.
              </label>
              {isAgreementInvalid ? (
                <p className="mt-2 text-[12px] text-red-500">
                  Please confirm that this information is accurate.
                </p>
              ) : null}

              <div className="mt-4 flex justify-center">
                <button
                  type="submit"
                  disabled={isSubmitting || isLoadingTargets}
                  className="inline-flex h-[44px] min-w-[186px] items-center justify-center gap-2 rounded-[10px] bg-[#ef295a] px-7 text-[15px] font-semibold text-white shadow-[0_10px_20px_rgba(239,41,90,0.24)] transition hover:bg-[#db1f4d] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <AlertTriangleMiniIcon className="h-4 w-4" />
                  {isSubmitting ? "Submitting..." : "Submit Report"}
                </button>
              </div>
            </div>
          </form>
        </section>

        <aside className="space-y-8">
          <section className="overflow-hidden rounded-[18px] border border-[#dbe2ef] bg-white">
            <div className="border-b border-[#dbe2ef] px-6 py-5">
              <h3 className="text-[15px] font-semibold text-[#24324b]">
                Your Reporting History
              </h3>
            </div>

            <div className="grid grid-cols-[1fr_1.15fr_0.95fr] gap-3 bg-[#f6f8fc] px-6 py-4 text-[10px] font-bold uppercase tracking-[0.14em] text-[#7b8ba5] md:grid-cols-[0.9fr_1fr_1fr_0.9fr]">
              <p className="hidden md:block">Report ID</p>
              <p>Target User</p>
              <p>Category</p>
              <p>Status</p>
            </div>

            <div className="divide-y divide-slate-100">
              {historyRows.length === 0 ? (
                <p className="px-6 py-10 text-center text-[12px] text-slate-400">
                  No previous reports found yet.
                </p>
              ) : (
                historyRows.slice(0, 2).map((row) => (
                  <div
                    key={row.id}
                    className="grid grid-cols-[1fr_1.15fr_0.95fr] items-center gap-3 px-6 py-5 text-[14px] text-slate-600 md:grid-cols-[0.9fr_1fr_1fr_0.9fr]"
                  >
                    <p className="hidden text-[12px] text-[#95a6c8] md:block">
                      {formatReportId(row.id)}
                    </p>
                    <p className="text-[15px] font-medium leading-7 text-[#24324b]">
                      {row.targetName}
                    </p>
                    <p className="text-[14px] text-[#667791]">{row.category}</p>
                    <StatusPill status={row.status} />
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-slate-100 bg-[#fbfcff] px-6 py-4 text-center">
              <button type="button" className="text-[13px] font-semibold text-[#2563eb]">
                Load Previous History
              </button>
            </div>
          </section>

          <section className="rounded-[18px] border border-[#dce3ff] bg-[#f5f7ff] px-6 py-6">
            <div className="flex items-center gap-3 text-[#4a4bb0]">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e6e9ff]">
                <InfoIcon className="h-4.5 w-4.5" />
              </div>
              <h3 className="text-[16px] font-semibold">Submission Tips</h3>
            </div>

            <ul className="mt-5 space-y-4 text-[14px] leading-6 text-[#4954aa]">
              <TipItem>
                Attach evidence: Always include screenshots of chat conversations as they
                serve as definitive proof.
              </TipItem>
              <TipItem>
                Timeliness: Report issues within 24 hours of the occurrence for the fastest
                response time from our moderation team.
              </TipItem>
              <TipItem>
                Stay professional: Be objective and factual in your description. Avoid
                emotional language for clearer investigations.
              </TipItem>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="block">
      <p className="mb-3 text-[14px] font-semibold text-[#42516b]">{label}</p>
      {children}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const className =
    normalized === "resolved"
      ? "bg-[#dff7eb] text-[#0b9d6b]"
      : normalized === "reviewing"
        ? "bg-[#e6efff] text-[#2f66e7]"
        : normalized === "rejected"
          ? "bg-slate-200 text-slate-600"
          : "bg-[#fff1cf] text-[#d8890d]";

  return (
    <span
      className={`inline-flex w-fit rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${className}`}
    >
      {status}
    </span>
  );
}

function TipItem({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-1 text-[#5b61e6]">
        <CheckIcon />
      </span>
      <span className="leading-6">{children}</span>
    </li>
  );
}

function formatReportId(id: string) {
  return `#TR-${id.slice(-4).toUpperCase()}`;
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const inputClassName =
  "h-10 w-full rounded-[10px] border border-[#d7dfec] bg-white px-4 text-[14px] text-[#36465f] outline-none transition focus:border-[#2f66e7] focus:ring-4 focus:ring-[#dbe7ff]";

function normalizeStatus(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "_").replace(/-/g, "_");
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3 5 6v5c0 5 3.5 8 7 10 3.5-2 7-5 7-10V6z" />
      <path d="m9.5 12 1.7 1.7 3.3-3.7" />
    </svg>
  );
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <circle cx="12" cy="12" r="10" />
      <path
        d="M12 7.2a1 1 0 0 1 1 1V12a1 1 0 1 1-2 0V8.2a1 1 0 0 1 1-1Zm0 9.5a1.15 1.15 0 1 1 0-2.3 1.15 1.15 0 0 1 0 2.3Z"
        fill="#fff"
      />
    </svg>
  );
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 16V7" strokeLinecap="round" />
      <path d="m8.5 10.5 3.5-3.5 3.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 16.5v1a2.5 2.5 0 0 0 2.5 2.5h9a2.5 2.5 0 0 0 2.5-2.5v-1" strokeLinecap="round" />
    </svg>
  );
}

function AlertTriangleMiniIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 4 4 19h16Z" strokeLinejoin="round" />
      <path d="M12 9v4" strokeLinecap="round" />
      <path d="M12 16h.01" strokeLinecap="round" />
    </svg>
  );
}

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 10v5" strokeLinecap="round" />
      <path d="M12 7h.01" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" fill="currentColor">
      <path d="M10 18a8 8 0 1 0-8-8 8 8 0 0 0 8 8Zm3.76-9.74a.75.75 0 1 0-1.06-1.06L9.2 10.7 7.8 9.3a.75.75 0 0 0-1.06 1.06l1.93 1.94a.75.75 0 0 0 1.06 0Z" />
    </svg>
  );
}
