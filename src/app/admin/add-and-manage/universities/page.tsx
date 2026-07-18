import type { Metadata } from "next";
import AdminAddAndManageGroupPage from "@/components/admin/admin-add-and-manage-group-page";

export const metadata: Metadata = {
  title: "Universities | Add & Manage Options | Admin | Skill Swap Hub",
  description: "Admin page to add and manage universities.",
};

export default function AdminUniversitiesAddAndManagePage() {
  return <AdminAddAndManageGroupPage groupKey="universities" />;
}
