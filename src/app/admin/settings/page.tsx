import type { Metadata } from "next";
import AdminSettings from "@/components/admin/admin-settings";

export const metadata: Metadata = {
  title: "Settings | Admin | Skill Swap Hub",
  description: "Admin account profile and password settings.",
};

export default function AdminSettingsPage() {
  return <AdminSettings />;
}
