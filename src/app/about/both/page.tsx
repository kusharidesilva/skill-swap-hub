import AboutPage from "@/components/about-page";
import Navbar from "@/components/navbar";
import SiteFooter from "@/components/footer";

export default function AboutBoth() {
  return (
    <div className="min-h-screen bg-[#f5f7ff] text-slate-900">
      <Navbar role="both" />
      <AboutPage
        primaryCtaLabel="Learn More"
        primaryCtaHref="#story"
        secondaryCtaLabel="Explore Skills"
        secondaryCtaHref="/home/both#explore-skills"
        ctaButtonLabel="Go to Dashboard"
        ctaButtonHref="/dashboard/both"
      />
      <SiteFooter role="both" />
    </div>
  );
}
