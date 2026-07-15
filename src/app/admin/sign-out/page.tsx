import type { Metadata } from "next";
import AdminSignOutPage from "@/components/admin/admin-sign-out-page";

export const metadata: Metadata = {
  title: "Admin Sign Out | Skill Swap Hub",
  description: "Sign out from the Skill Swap Hub admin panel.",
};

export default function AdminSignOutRoute() {
  return <AdminSignOutPage />;
}
