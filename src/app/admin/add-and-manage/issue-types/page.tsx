import type { Metadata } from "next";
import AdminAddAndManageGroupPage from "@/components/admin/admin-add-and-manage-group-page";

export const metadata: Metadata = {
  title: "Issue Types | Add & Manage Options | Admin | Skill Swap Hub",
  description: "Admin page to add and manage issue types.",
};

export default function AdminIssueTypesAddAndManagePage() {
  return <AdminAddAndManageGroupPage groupKey="issueTypes" />;
}
