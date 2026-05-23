import ProviderProfileSettings from "@/components/profile-settings/provider-profile-settings";
import ProfileShell from "@/components/profile-shell";

export default function ProviderProfileSettingsPage() {
  return (
    <ProfileShell role="provider">
      <ProviderProfileSettings />
    </ProfileShell>
  );
}
