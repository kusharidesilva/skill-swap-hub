import type { Metadata } from "next";
import AdminVerifications from "@/components/admin/admin-verifications";

export const metadata: Metadata = {
  title: "Verifications | Admin | Skill Swap Hub",
  description: "Review verification requests from the admin panel.",
};

export default function VerificationsPage() {
  return <AdminVerifications />;
}
