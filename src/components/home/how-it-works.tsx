import ScrollReveal from "@/components/scroll-reveal";

const steps = [
  {
    title: "Create Your Account",
    description:
      "Join as a student or buyer and complete the account setup needed for your role.",
  },
  {
    title: "Complete Verification",
    description:
      "Student providers verify their campus details before publishing skills and services.",
  },
  {
    title: "Request or Offer Services",
    description:
      "Post what you offer or need, connect through chat, and complete the exchange with ratings and reviews.",
  },
];

export default function HowItWorksSection() {
  return (
    // Three steps explain the complete skill-swap journey at a glance.
    <section id="how-it-works" className="ssh-section-soft bg-white py-12 sm:py-16 lg:py-24 scroll-mt-20">
      <div className="relative z-10 mx-auto max-w-6xl px-5 sm:px-6">
        <ScrollReveal delayMs={30}>
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl leading-tight">
              How It Works
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base sm:text-lg text-slate-700">
              Simple steps to start offering or requesting trusted skill-based support.
            </p>
          </div>
        </ScrollReveal>
        <div className="mt-8 grid gap-4 sm:gap-5 md:grid-cols-3 lg:mt-14 lg:gap-8">
          {steps.map((step, index) => (
            <ScrollReveal key={step.title} delayMs={90 + index * 80}>
              <div
                className="ssh-card ssh-step-card group relative rounded-2xl border border-emerald-100/60 bg-[#f4fbf7]/40 p-5 text-center shadow-xs transition-all duration-300 hover:scale-[1.03] hover:bg-white hover:border-emerald-300/80 hover:shadow-md sm:p-6 lg:p-8"
              >
                <span className="ssh-step-index mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#e6fcf4] text-lg font-bold text-[#0f8a6b] shadow-xs group-hover:scale-110 transition-transform duration-300 sm:h-14 sm:w-14 sm:text-xl">
                  {index + 1}
                </span>
                <h3 className="mt-4 text-lg sm:mt-6 sm:text-xl font-bold text-slate-900">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm sm:text-base leading-relaxed text-slate-600">
                  {step.description}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
