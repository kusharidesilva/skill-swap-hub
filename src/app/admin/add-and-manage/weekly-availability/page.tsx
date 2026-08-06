import type { Metadata } from "next";
import AdminAddAndManageGroupPage from "@/components/admin/admin-add-and-manage-group-page";

export const metadata: Metadata = {
  title: "Weekly Availability | Add & Manage Options | Admin | Skill Swap Hub",
  description: "Admin page to add and manage weekly availability days.",
};

export default function AdminWeeklyAvailabilityAddAndManagePage() {
  return <AdminAddAndManageGroupPage groupKey="availabilityDays" />;
}
