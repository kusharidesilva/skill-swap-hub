import AboutPage from "@/components/about-page";
import Navbar from "@/components/navbar";
import SiteFooter from "@/components/footer";

export default function AboutBuyer() {
  return (
    <div className="min-h-screen bg-[#f5f7ff] text-slate-900">
      <Navbar />
      <AboutPage
        primaryCtaLabel="Learn More"
        primaryCtaHref="#story" 
        secondaryCtaLabel="Explore Skills"
        secondaryCtaHref="/home/buyer#explore-skills"
        ctaButtonLabel="Go to Dashboard"
        ctaButtonHref="/dashboard/buyer"
      />
      <SiteFooter role="buyer" />
    </div>
  );
}
