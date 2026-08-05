import { normalizeModerationStatus } from "@/lib/moderation";

export function normalizeAdminPanelValue(value?: string) {
  return (value || "")
    .trim()
    .toLowerCase()
    .replace(/[+&/]/g, "_")
    .replace(/\s+/g, "_")
    .replace(/-/g, "_")
    .replace(/_+/g, "_");
}

export function normalizeAdminRole(role?: string) {
  const normalized = normalizeAdminPanelValue(role);

  if (
    normalized === "buyer_provider" ||
    normalized === "provider_buyer" ||
    normalized === "buyer_and_provider" ||
    normalized === "provider_and_buyer"
  ) {
    return "both";
  }

  return normalized;
}

export function isPendingAdminReport(report: {
  status?: string;
  adminNeedsReview?: boolean;
}) {
  const normalizedStatus = normalizeModerationStatus(report.status || "Pending");

  if (
    normalizedStatus === "resolve" ||
    normalizedStatus === "reject" ||
    normalizedStatus === "suspend"
  ) {
    return false;
  }

  return normalizedStatus === "pending" || report.adminNeedsReview === true;
}

export function getAdminReportStatus(report: {
  status?: string;
  adminNeedsReview?: boolean;
}) {
  return isPendingAdminReport(report) ? "Pending" : report.status || "Pending";
}

export function isResolvedAdminReport(status?: string) {
  return normalizeModerationStatus(status || "") === "resolve";
}

export function isRejectedAdminReport(status?: string) {
  return normalizeModerationStatus(status || "") === "reject";
}
