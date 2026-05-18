import HeroSection from "@/components/home/hero";
import HowItWorksSection from "@/components/home/how-it-works";
import SiteFooter from "@/components/home/site-footer";
import SkillGigsSection from "@/components/home/skill-gigs";
import VerifiedStudentsSection from "@/components/home/verified-students";
import Navbar from "@/components/navbar/navbar-all users";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#f5f7ff] text-slate-900">
      <Navbar />
      <main>
        <HeroSection />
        <SkillGigsSection />
        <VerifiedStudentsSection />
        <HowItWorksSection />
      </main>
      <SiteFooter />
    </div>
  );
}