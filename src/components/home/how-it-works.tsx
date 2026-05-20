const steps = [
  {
    title: "Verify Email",
    description:
      "Sign up with your .edu email address to join the verified student network.",
  },
  {
    title: "Post Skills",
    description:
      "List what you can teach and what you want to learn to build your profile.",
  },
  {
    title: "Match and Swap",
    description:
      "Connect with peers, arrange a session, and start mastering new skills together.",
  },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="relative overflow-hidden bg-white py-16 sm:py-24 scroll-mt-20">
      <div
        className="absolute -right-24 bottom-8 h-64 w-64 rounded-full bg-white/60 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="absolute left-0 bottom-0 h-72 w-72 rounded-full bg-[#e6fcf4]/70 blur-3xl"
        aria-hidden="true"
      />
      <div className="relative z-10 mx-auto max-w-6xl px-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl leading-tight">
            How It Works
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base sm:text-lg text-slate-700">
            Simple steps to start learning and teaching.
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
