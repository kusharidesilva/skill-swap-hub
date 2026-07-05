import ProfileSettings from "@/components/profile-settings/profile-settings"; 
import ProfileShell from "@/components/profile-shell";

export default function BuyerProfileSettingsPage() {
  return (
    <ProfileShell role="buyer">
      <ProfileSettings role="buyer" /> 
    </ProfileShell> 
  );
}
