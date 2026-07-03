import type { Metadata } from "next";
import AdminSettings from "@/components/admin/admin-settings";

export const metadata: Metadata = {
  title: "Settings | Admin | Skill Swap Hub",
  description: "Admin profile and system settings.",
};

export default function AdminSettingsPage() {
  return <AdminSettings />;
}
