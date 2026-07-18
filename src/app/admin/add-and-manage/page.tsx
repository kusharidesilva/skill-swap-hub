import type { Metadata } from "next";
import AdminAddAndManageSettings from "@/components/admin/admin-add-and-manage-settings";

export const metadata: Metadata = {
  title: "Add & Manage Options | Admin | Skill Swap Hub",
  description: "Admin page to add and manage shared option lists for Skill Swap Hub.",
};

export default function AdminAddAndManagePage() {
  return <AdminAddAndManageSettings />;
}
