import HeroSection from "@/components/home/hero";
import HowItWorksSection from "@/components/home/how-it-works";
import SiteFooter from "@/components/footer";
import SkillGigsSection from "@/components/home/skill-gigs";
import VerifiedStudentsSection from "@/components/home/verified-students";
import Navbar from "@/components/navbar"; 

export default function Home() {
  return (
    <div className="ssh-page-shell min-h-screen bg-[#f5f7ff] text-slate-900">
      <Navbar />
      <main>
        {/* Landing page sections */}
        <HeroSection />
        <SkillGigsSection />
        <VerifiedStudentsSection />
        <HowItWorksSection />
      </main>
      <SiteFooter />
    </div>
  );
}
