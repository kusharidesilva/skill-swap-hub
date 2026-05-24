import { redirect } from "next/navigation";

import ProfileShell from "@/components/profile-shell";
import ReportProfilePage from "@/components/report-profile-page";
import { isRole } from "@/lib/role-routes";

type ReportProfileRouteProps = {
  params: Promise<{
    providerId: string;
  }>;
  searchParams?: Promise<{
    role?: string;
  }>;
};

export default async function ReportProfileRoute({
  params,
  searchParams,
}: ReportProfileRouteProps) {
  const { providerId } = await params;
  const query = await searchParams;
  const requestedRole = query?.role;

  if (!isRole(requestedRole)) {
    redirect("/get-started");
  }

  return (
    <ProfileShell role={requestedRole}>
      <div className="mx-auto w-full max-w-6xl">
        <ReportProfilePage providerName={providerId} role={requestedRole} />
      </div>
    </ProfileShell>
  );
}
