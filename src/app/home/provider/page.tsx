import HeroSection from "@/components/home/hero";
import HowItWorksSection from "@/components/home/how-it-works";
import SkillGigsSection from "@/components/home/skill-gigs";
import VerifiedStudentsSection from "@/components/home/verified-students";
import SiteFooter from "@/components/footer";
import Navbar from "@/components/navbar";

export default function ProviderHome() {
  return (
    <div className="min-h-screen bg-[#f5f7ff] text-slate-900">
      <Navbar />
      <main>
        <HeroSection role="provider" />
        <SkillGigsSection />
        <VerifiedStudentsSection />
        <HowItWorksSection />
      </main>
      <SiteFooter role="provider" />
    </div>
  );
}
