import { notFound } from "next/navigation";

import SiteFooter from "@/components/footer";
import Navbar from "@/components/navbar";
import SubmitReviewPage from "@/components/submit-review-page";
import { isRole } from "@/lib/role-routes";

type SubmitReviewRolePageProps = {
  params: Promise<{ role?: string | string[] }>;
  searchParams?: Promise<{ peer?: string }>;
};

export default async function SubmitReviewRolePage({
  params,
  searchParams,
}: SubmitReviewRolePageProps) {
  const { role } = await params;
  const query = await searchParams;

  if (!isRole(role)) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#f5f7ff] text-slate-900">
      <Navbar role={role} />
      <main className="mx-auto w-full max-w-6xl px-6 py-8">
        <SubmitReviewPage role={role} peer={query?.peer} />
      </main>
      <SiteFooter role={role} />
    </div>
  );
}
