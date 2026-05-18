import SiteFooter from "@/components/footer";
import SupportPage from "@/components/support-page";
import Navbar from "@/components/navbar/navbar-user after login";

export default function HelpBuyer() {
  return (
    <div className="min-h-screen bg-[#f5f7ff] text-slate-900">
      <Navbar />
      <SupportPage />
      <SiteFooter />
    </div>
  );
}
