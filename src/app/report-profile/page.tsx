import { redirect } from "next/navigation";

import ProfileShell from "@/components/profile-shell";
import ReportProfilePage from "@/components/report-profile-page";
import { isRole } from "@/lib/role-routes";

type ReportProfilePageProps = {
  searchParams?: Promise<{
    role?: string;
  }>;
};

export default async function ReportProfilePageEntry({
  searchParams,
}: ReportProfilePageProps) {
  const query = await searchParams;
  const requestedRole = query?.role;

  if (!isRole(requestedRole)) {
    redirect("/get-started");
  }

  return (
    <ProfileShell role={requestedRole}>
      <div className="mx-auto w-full max-w-6xl">
        <ReportProfilePage providerName="Select a user" role={requestedRole} />
      </div>
    </ProfileShell>
  );
}
