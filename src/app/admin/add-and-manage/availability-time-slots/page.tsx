import type { Metadata } from "next";
import AdminAddAndManageGroupPage from "@/components/admin/admin-add-and-manage-group-page";

export const metadata: Metadata = {
  title: "Availability Time Slots | Add & Manage Options | Admin | Skill Swap Hub",
  description: "Admin page to add and manage availability time slots.",
};

export default function AdminAvailabilityTimeSlotsAddAndManagePage() {
  return <AdminAddAndManageGroupPage groupKey="availabilityTimeSlots" />;
}
