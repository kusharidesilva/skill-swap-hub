import ProfileSettings from "@/components/profile-settings/profile-settings";
import ProfileShell from "@/components/profile-shell";

export default function ProviderProfileSettingsPage() {
  return (
    <ProfileShell role="provider">
      <ProfileSettings role="provider" />
    </ProfileShell>
  );
}
