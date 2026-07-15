import type { Metadata } from "next";
import AdminLookupSettings from "@/components/admin/admin-lookup-settings";

export const metadata: Metadata = {
  title: "Lookup Settings | Admin | Skill Swap Hub",
  description: "Admin lookup data settings for Skill Swap Hub.",
};

export default function AdminLookupSettingsPage() {
  return <AdminLookupSettings />;
}
