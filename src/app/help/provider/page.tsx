import SiteFooter from "@/components/footer";
import SupportPage from "@/components/support-page";
import Navbar from "@/components/navbar/navbar-provider";

export default function HelpProvider() {
  return (
    <div className="min-h-screen bg-[#f5f7ff] text-slate-900">
      <Navbar />
      <SupportPage />
      <SiteFooter />
    </div>
  );
}
