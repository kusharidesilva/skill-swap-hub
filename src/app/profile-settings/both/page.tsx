import BothProfileSettings from "@/components/profile-settings/both-profile-settings";
import ProfileShell from "@/components/profile-shell";

export default function BothProfileSettingsPage() {
  return (
    <ProfileShell role="both">
      <BothProfileSettings />
    </ProfileShell>
  );
}
