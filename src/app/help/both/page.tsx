import SiteFooter from "@/components/footer";
import SupportPage from "@/components/support-page";
import Navbar from "@/components/navbar";

export default function HelpBoth() {
  return (
    <div className="min-h-screen bg-[#f5f7ff] text-slate-900">
      <Navbar role="both" />
      <SupportPage />
      <SiteFooter role="both" />
    </div>
  );
}
