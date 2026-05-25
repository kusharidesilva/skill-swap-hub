import SiteFooter from "@/components/footer";
import FindServicesPageContent from "@/components/find-services-page";
import Navbar from "@/components/navbar";
import { isRole } from "@/lib/role-routes";

type ExploreServicesPageProps = {
  searchParams?: Promise<{
    role?: string;
  }>;
};

export default async function ExploreServicesPage({
  searchParams,
}: ExploreServicesPageProps) {
  const params = await searchParams;
  const requestedRole = params?.role;
  const navbarRole = isRole(requestedRole) ? requestedRole : undefined;

  return (
    <div className="min-h-screen bg-[#f5f7ff] text-slate-900">
      <Navbar role={navbarRole} />
      <main className="mx-auto w-full max-w-6xl px-6 py-8">
        <FindServicesPageContent role={navbarRole} />
      </main>
      <SiteFooter role={navbarRole} />
    </div>
  );
}
