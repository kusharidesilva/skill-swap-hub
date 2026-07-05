import SiteFooter from "@/components/footer"; 
import Navbar from "@/components/navbar"; 
import BuyerProfilePublicPage from "@/components/buyer-profile-public-page"; 
import { isRole } from "@/lib/role-routes"; 

type BuyerProfilePageProps = { 
  params: Promise<{
    buyerId: string;
  }>;
  searchParams?: Promise<{
    role?: string;
  }>;
};

export default async function BuyerProfilePage({
  params,
  searchParams,
}: BuyerProfilePageProps) {
  const { buyerId } = await params;
  const query = await searchParams;
  const requestedRole = query?.role;
  // The optional role keeps links correct without changing the public profile URL.
  const role = isRole(requestedRole) ? requestedRole : undefined;

  return (
    <div className="min-h-screen bg-[#f5f7ff] text-slate-900">
      <Navbar role={role} />
      <main className="mx-auto w-full max-w-4xl px-4 py-5 sm:px-6">
        <BuyerProfilePublicPage buyerId={buyerId} role={role} />
      </main>
      <SiteFooter role={role} />
    </div>
  );
}
