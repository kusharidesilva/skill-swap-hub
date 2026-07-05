import { notFound } from "next/navigation";

import ProfileShell from "@/components/profile-shell";
import ReportProfilePage from "@/components/report-profile-page";
import { isRole } from "@/lib/role-routes";

type TargetedReportPageProps = {
  params: Promise<{
    role?: string;
    providerId?: string;
  }>;
};

export default async function TargetedReportPage({ params }: TargetedReportPageProps) {
  const { role, providerId } = await params;

  // A targeted report needs both a valid viewer role and a real target ID.
  if (!isRole(role) || !providerId) {
    notFound();
  }

  return (
    <ProfileShell role={role}>
      <div className="mx-auto w-full max-w-6xl">
        <ReportProfilePage providerId={providerId} />
      </div>
    </ProfileShell>
  );
}
