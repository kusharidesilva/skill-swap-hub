import type { Metadata } from "next";
import AdminLookupGroupPage from "@/components/admin/admin-lookup-group-page";

export const metadata: Metadata = {
  title: "Universities | Lookup Settings | Admin | Skill Swap Hub",
  description: "Admin university lookup settings.",
};

export default function AdminUniversitiesLookupPage() {
  return <AdminLookupGroupPage groupKey="universities" />;
}
