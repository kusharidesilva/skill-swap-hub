import { notFound } from "next/navigation";

import ProfileShell from "@/components/profile-shell";
import ReportIssuePageContent from "@/components/report-issue-page";
import { isRole } from "@/lib/role-routes";

type RolePageProps = {
  params: Promise<{ role?: string | string[] }>;
};

export default async function RoleReportIssuePage({ params }: RolePageProps) {
  const { role } = await params;

  if (!isRole(role)) {
    notFound();
  }

  return (
    <ProfileShell role={role}>
      <ReportIssuePageContent />
    </ProfileShell>
  );
}
