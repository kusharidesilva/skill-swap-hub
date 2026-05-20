import ProfileShell from "@/components/profile-shell";

export default function ProviderProfileSettingsPage() {
  return (
    <ProfileShell role="provider">
      <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Profile Settings</h1>
        <p className="mt-2 text-sm text-slate-600">
          Replace this section with profile settings content.
        </p>
      </section>
    </ProfileShell>
  );
}
