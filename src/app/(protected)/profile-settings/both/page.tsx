import ProfileSettings from "@/components/profile-settings/profile-settings"; 
import ProfileShell from "@/components/profile-shell"; 

export default function BothProfileSettingsPage() {
  return (
    <ProfileShell role="both">
      <ProfileSettings role="both" /> 
    </ProfileShell>
  );
}
