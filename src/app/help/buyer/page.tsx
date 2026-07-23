import SiteFooter from "@/components/footer";
import SupportPage from "@/components/support-page";
import Navbar from "@/components/navbar"; 

export default function HelpBuyer() {
  return (
    <div className="ssh-page-shell min-h-screen bg-[#f5f7ff] text-slate-900">
      <Navbar />
      <SupportPage />
      <SiteFooter role="buyer" />
    </div>
  ); 
}
