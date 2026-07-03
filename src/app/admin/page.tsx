import type { Metadata } from "next";
import AdminDashboard from "@/components/admin/admin-dashboard";

export const metadata: Metadata = {
  title: "Admin Dashboard | Skill Swap Hub",
  description: "Admin dashboard frontend for Skill Swap Hub.",
};

export default function AdminDashboardPage() {
  return <AdminDashboard />;
}
