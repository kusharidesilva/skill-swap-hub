import ProfileShell from "@/components/profile-shell";
import ReportProfilePage from "@/components/report-profile-page";

export default function ReportIssuePage() {
  return (
    <ProfileShell role="buyer">
      <div className="mx-auto w-full max-w-6xl">
        <ReportProfilePage />
      </div>
    </ProfileShell>
  );
}
