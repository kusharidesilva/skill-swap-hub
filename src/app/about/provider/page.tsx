import AboutPage from "@/components/about/about-page";
import Navbar from "@/components/navbar/navbar-provider";
import SiteFooter from "@/components/footer";

export default function AboutProvider() {
  return (
    <div className="min-h-screen bg-[#f5f7ff] text-slate-900">
      <Navbar />
      <AboutPage
        primaryCtaLabel="Learn More"
        primaryCtaHref="/learn-more"
        secondaryCtaLabel="Explore Skills"
        secondaryCtaHref="/explore"
        ctaButtonLabel="Go to Dashboard"
        ctaButtonHref="/dashboard"
      />
      <SiteFooter />
    </div>
  );
}
