import type { Metadata } from "next";
import AdminIssueResolution from "@/components/admin/admin-issue-resolution";

export const metadata: Metadata = {
  title: "Issue Resolution | Admin | Skill Swap Hub",
  description: "Track and resolve admin moderation issues.",
};

export default function IssueResolutionPage() {
  return <AdminIssueResolution />;
}
