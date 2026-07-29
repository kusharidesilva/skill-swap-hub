import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

import { db, storage } from "@/lib/firebase";

export const ADMIN_CONTACT_EMAIL = "admin@skillswaphub.lk";
export const MODERATION_EVIDENCE_ACCEPT =
  ".png,.jpg,.jpeg,.doc,.docx,image/png,image/jpeg,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
export const MAX_MODERATION_EVIDENCE_SIZE_BYTES = 1 * 1024 * 1024;

export type TimestampLike =
  | { toDate?: () => Date; toMillis?: () => number }
  | Date
  | string
  | number
  | null
  | undefined;

export type ModerationEvidenceFile = {
  name?: string;
  url?: string;
  type?: string;
  size?: number;
};

export type ModerationAction = "warn" | "suspend" | "reject" | "resolve";

export function normalizeModerationStatus(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "_").replace(/-/g, "_");
}

export function formatReportId(id: string) {
  if (!id) return "#ISS-UNKNOWN";
  if (id.startsWith("#")) return id;
  if (id.toUpperCase().startsWith("ISS-")) return `#${id.toUpperCase()}`;
  return `#ISS-${id.slice(-5).toUpperCase()}`;
}

export function generateReportCode() {
  const timePart = Date.now().toString(36).toUpperCase().slice(-6);
  const randomPart = Math.random().toString(36).toUpperCase().slice(2, 6);
  return `ISS-${timePart}${randomPart}`;
}

export function moderationActionLabel(action: ModerationAction) {
  if (action === "warn") return "Warn";
  if (action === "suspend") return "Suspend";
  if (action === "reject") return "Reject";
  return "Resolve";
}

export function moderationActionDescription(action: ModerationAction) {
  if (action === "warn") return "Warning issued";
  if (action === "suspend") return "Account suspended";
  if (action === "reject") return "Report rejected";
  return "Report resolved";
}

export function toMillis(value: TimestampLike) {
  if (!value) return 0;
  if (typeof value === "object" && "toMillis" in value && typeof value.toMillis === "function") {
    return value.toMillis();
  }
  if (typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate().getTime();
  }
  if (value instanceof Date) return value.getTime();
  if (typeof value === "object") return 0;
  return new Date(value).getTime() || 0;
}

export function isAllowedModerationEvidenceFile(file: File) {
  const allowedTypes = new Set([
    "image/png",
    "image/jpeg",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ]);

  return (
    file.size > 0 &&
    file.size <= MAX_MODERATION_EVIDENCE_SIZE_BYTES &&
    allowedTypes.has(file.type)
  );
}

export async function uploadModerationEvidence(
  userId: string,
  file: File,
  folder = "reports",
) {
  if (!isAllowedModerationEvidenceFile(file)) {
    throw new Error("Only JPG, PNG, DOC, or DOCX files up to 1MB are allowed.");
  }

  const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const storagePath = `${folder}/${userId}/${Date.now()}-${safeFileName}`;
  const evidenceRef = ref(storage, storagePath);

  await uploadBytes(evidenceRef, file, { contentType: file.type });
  const url = await getDownloadURL(evidenceRef);

  return {
    name: file.name,
    size: file.size,
    type: file.type,
    url,
  } satisfies ModerationEvidenceFile;
}

export async function queueEmail(params: {
  to: string;
  subject: string;
  text: string;
  html: string;
  metadata?: Record<string, unknown>;
}) {
  await addDoc(collection(db, "mail"), {
    to: [params.to],
    message: {
      subject: params.subject,
      text: params.text,
      html: params.html,
    },
    metadata: params.metadata || {},
    createdAt: serverTimestamp(),
  });
}
