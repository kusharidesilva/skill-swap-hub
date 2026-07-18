import type { Metadata } from "next";
import AdminAddAndManageGroupPage from "@/components/admin/admin-add-and-manage-group-page";

export const metadata: Metadata = {
  title: "Service Categories | Add & Manage Options | Admin | Skill Swap Hub",
  description: "Admin page to add and manage service categories.",
};

export default function AdminServiceCategoriesAddAndManagePage() {
  return <AdminAddAndManageGroupPage groupKey="serviceCategories" />;
}
