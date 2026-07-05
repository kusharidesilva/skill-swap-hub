import AboutPage from "@/components/about-page";
import Navbar from "@/components/navbar"; 
import SiteFooter from "@/components/footer";

export default function About() {
  return (
    <div className="min-h-screen bg-[#f5f7ff] text-slate-900">
      <Navbar />
      <AboutPage
        primaryCtaLabel="Join the Hub"
        primaryCtaHref="/get-started"
        secondaryCtaLabel="Explore Skills"
        secondaryCtaHref="/#explore-skills" 
        ctaButtonLabel="Create Your Profile"
        ctaButtonHref="/get-started"
      />
      <SiteFooter />
    </div>
  );
}
