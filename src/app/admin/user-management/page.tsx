import type { Metadata } from "next";
import AdminUserManagement from "@/components/admin/admin-user-management";

export const metadata: Metadata = {
  title: "User Management | Admin | Skill Swap Hub",
  description: "Manage and review student accounts in the admin panel.",
};

export default function UserManagementPage() {
  return <AdminUserManagement />;
}
