import SiteFooter from "@/components/footer";
import FindServicesPageContent from "@/components/find-services-page";
import Navbar from "@/components/navbar";

type ExploreServicesPageProps = {
  searchParams?: Promise<{
    role?: string;
  }>;
};

export default async function ExploreServicesPage({
  searchParams,
}: ExploreServicesPageProps) {
  const params = await searchParams;
  const navbarRole = params?.role === "provider" ? "provider" : undefined;

  return (
    <div className="min-h-screen bg-[#f5f7ff] text-slate-900">
      <Navbar role={navbarRole} />
      <main className="mx-auto w-full max-w-6xl px-6 py-8">
        <FindServicesPageContent />
      </main>
      <SiteFooter />
    </div>
  );
}
