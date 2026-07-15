import type { Metadata } from "next";
import AdminLookupGroupPage from "@/components/admin/admin-lookup-group-page";

export const metadata: Metadata = {
  title: "Issue Types | Lookup Settings | Admin | Skill Swap Hub",
  description: "Admin issue type lookup settings.",
};

export default function AdminIssueTypesLookupPage() {
  return <AdminLookupGroupPage groupKey="issueTypes" />;
}
