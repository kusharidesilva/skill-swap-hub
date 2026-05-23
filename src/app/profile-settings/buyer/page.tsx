import BuyerProfileSettings from "@/components/profile-settings/buyer-profile-settings";
import ProfileShell from "@/components/profile-shell";

export default function BuyerProfileSettingsPage() {
  return (
    <ProfileShell role="buyer">
      <BuyerProfileSettings />
    </ProfileShell>
  );
}
