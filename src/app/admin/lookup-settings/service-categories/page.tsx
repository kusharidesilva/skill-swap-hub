import type { Metadata } from "next";
import AdminLookupGroupPage from "@/components/admin/admin-lookup-group-page";

export const metadata: Metadata = {
  title: "Service Categories | Lookup Settings | Admin | Skill Swap Hub",
  description: "Admin service category lookup settings.",
};

export default function AdminServiceCategoriesLookupPage() {
  return <AdminLookupGroupPage groupKey="serviceCategories" />;
}
