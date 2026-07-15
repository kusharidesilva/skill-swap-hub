import type { Metadata } from "next";
import AdminLookupGroupPage from "@/components/admin/admin-lookup-group-page";

export const metadata: Metadata = {
  title: "Availability Time Slots | Lookup Settings | Admin | Skill Swap Hub",
  description: "Admin availability time slot lookup settings.",
};

export default function AdminAvailabilityTimeSlotsLookupPage() {
  return <AdminLookupGroupPage groupKey="availabilityTimeSlots" />;
}
