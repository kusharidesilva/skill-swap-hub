import type { Metadata } from "next";
import AdminLookupGroupPage from "@/components/admin/admin-lookup-group-page";

export const metadata: Metadata = {
  title: "Year of Study Options | Lookup Settings | Admin | Skill Swap Hub",
  description: "Admin year of study lookup settings.",
};

export default function AdminYearOfStudyLookupPage() {
  return <AdminLookupGroupPage groupKey="yearOfStudyOptions" />;
}
