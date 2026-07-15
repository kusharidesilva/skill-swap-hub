import type { Metadata } from "next";
import AdminLoginPage from "@/components/admin/admin-login-page";

export const metadata: Metadata = {
  title: "Admin Login | Skill Swap Hub",
  description: "Secure admin login for Skill Swap Hub.",
};

export default function AdminLoginRoute() {
  return <AdminLoginPage />;
}
