import SiteFooter from "@/components/footer";
import Navbar from "@/components/navbar";
import ProviderProfilePublicPage from "@/components/provider-profile-public-page";
import { isRole } from "@/lib/role-routes";

type ProviderProfilePageProps = {
  params: Promise<{
    providerId: string;
  }>;
  searchParams?: Promise<{
    role?: string;
    tab?: string;
  }>;
};

export default async function ProviderProfilePage({
  params,
  searchParams,
}: ProviderProfilePageProps) {
  const { providerId } = await params;
  const query = await searchParams;
  const requestedRole = query?.role;
  const requestedTab = query?.tab;
  const role = isRole(requestedRole) ? requestedRole : undefined;
  const activeTab = requestedTab === "reviews" ? "reviews" : "gigs";

  return (
    <div className="min-h-screen bg-[#f5f7ff] text-slate-900">
      <Navbar role={role} />
      <main className="mx-auto w-full max-w-6xl px-6 py-8">
        <ProviderProfilePublicPage
          providerId={providerId}
          role={role}
          activeTab={activeTab}
        />
      </main>
      <SiteFooter role={role} />
    </div>
  );
}
