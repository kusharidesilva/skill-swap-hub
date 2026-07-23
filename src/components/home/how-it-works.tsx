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
    <section id="how-it-works" className="bg-white py-16 sm:py-24 scroll-mt-20">
      <div className="relative z-10 mx-auto max-w-6xl px-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl leading-tight">
            How It Works
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base sm:text-lg text-slate-700">
            Simple steps to start offering or requesting trusted skill-based support.
          </p>
        </div>
        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="group relative rounded-2xl border border-emerald-100/60 bg-[#f4fbf7]/40 p-8 text-center shadow-xs transition-all duration-300 hover:scale-[1.03] hover:bg-white hover:border-emerald-300/80 hover:shadow-md"
            >
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#e6fcf4] text-xl font-bold text-[#0f8a6b] shadow-xs group-hover:scale-110 transition-transform duration-300">
                {index + 1}
              </span>
              <h3 className="mt-6 text-lg sm:text-xl font-bold text-slate-900">
                {step.title}
              </h3>
              <p className="mt-3 text-sm sm:text-base leading-relaxed text-slate-600">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
