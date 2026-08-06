export const SERVICE_CATEGORIES = [
  "Photography",
  "Videography",
  "Event Decoration",
  "Handmade Crafts / Gift Items",
  "Content Writing",
  "Graphic Design",
  "Video Editing",
  "Dancing",
  "Singing",
  "Other",
] as const;

export const AVAILABILITY_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export const AVAILABILITY_TIME_SLOTS = [
  "Morning",
  "Afternoon",
  "Evening",
] as const;

export const YEAR_OF_STUDY_OPTIONS = [
  "1st Year",
  "2nd Year",
  "3rd Year",
  "4th Year",
] as const;

export const ISSUE_TYPES = [
  "Poor service",
  "Fake user",
  "Payment issue",
  "Inappropriate behaviour",
  "No response",
  "Other",
] as const;

export const STUDENT_PROOF_TYPES = [
  "Student ID",
  "Confirmation Letter",
] as const;

export const STUDENT_PROOF_ACCEPT =
  ".pdf,.doc,.docx,.png,.jpg,.jpeg,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png,image/jpeg";

export const STUDENT_PROOF_EXTENSIONS = [
  "pdf",
  "doc",
  "docx",
  "png",
  "jpg",
  "jpeg",
] as const;

export const ALLOWED_STUDENT_PROOF_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png",
  "image/jpeg",
] as const;

export const MAX_STUDENT_PROOF_SIZE_BYTES = 2 * 1024 * 1024;

export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number];
export type AvailabilityDay = (typeof AVAILABILITY_DAYS)[number];
export type AvailabilityTimeSlot = (typeof AVAILABILITY_TIME_SLOTS)[number];
export type YearOfStudyOption = (typeof YEAR_OF_STUDY_OPTIONS)[number];
export type IssueType = (typeof ISSUE_TYPES)[number];
export type StudentProofType = (typeof STUDENT_PROOF_TYPES)[number];

export type AccountType = "student" | "non-student";
export type AccountStatus =
  | "active"
  | "pending_email_verification"
  | "pending_admin_verification"
  | "pending_verification"
  | "suspended"
  | "deleted";
export type ProviderVerificationStatus =
  | "not_required"
  | "pending"
  | "approved"
  | "rejected";

export type AvailabilitySlot = {
  day: AvailabilityDay;
  timeSlot: AvailabilityTimeSlot;
};

export function isPendingAdminVerificationStatus(status?: string | null) {
  return status === "pending_admin_verification" || status === "pending_verification";
}

export function isAllowedStudentProofFile(file: File): boolean {
  const allowedTypes = ALLOWED_STUDENT_PROOF_MIME_TYPES as readonly string[];
  const extension = file.name.split(".").pop()?.toLowerCase();
  const allowedExtensions = STUDENT_PROOF_EXTENSIONS as readonly string[];

  return (
    file.size > 0 &&
    file.size <= MAX_STUDENT_PROOF_SIZE_BYTES &&
    (allowedTypes.includes(file.type) ||
      Boolean(extension && allowedExtensions.includes(extension)))
  );
}

export function normalizeServiceCategory(value: string): ServiceCategory {
  const normalized = value.trim().toLowerCase();
  const match = SERVICE_CATEGORIES.find(
    (category) => category.toLowerCase() === normalized,
  );

  return match ?? "Other";
}

export function inferServiceCategory(value: string): ServiceCategory {
  const text = value.toLowerCase();
  if (["photo", "camera", "lightroom"].some((term) => text.includes(term))) {
    return "Photography";
  }
  if (["video", "film", "premiere"].some((term) => text.includes(term))) {
    return "Video Editing";
  }
  if (["decorate", "event", "party"].some((term) => text.includes(term))) {
    return "Event Decoration";
  }
  if (["craft", "gift", "handmade"].some((term) => text.includes(term))) {
    return "Handmade Crafts / Gift Items";
  }
  if (["write", "content", "copy"].some((term) => text.includes(term))) {
    return "Content Writing";
  }
  if (["graphic", "logo", "poster", "design"].some((term) => text.includes(term))) {
    return "Graphic Design";
  }
  if (["dance", "dancing"].some((term) => text.includes(term))) {
    return "Dancing";
  }
  if (["sing", "vocal", "music"].some((term) => text.includes(term))) {
    return "Singing";
  }
  return "Other";
}
