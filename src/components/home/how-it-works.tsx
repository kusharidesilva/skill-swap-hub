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
    <section id="how-it-works" className="bg-white scroll-mt-20">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">
            How It Works
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Simple steps to start learning and teaching.
          </p>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="rounded-2xl border border-slate-200 bg-[#f8f9ff] p-6 text-center shadow-sm"
            >
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#e8f1ff] text-base font-semibold text-[#0f4cbf]">
                {index + 1}
              </span>
              <h3 className="mt-4 text-sm font-semibold text-slate-900">
                {step.title}
              </h3>
              <p className="mt-2 text-sm text-slate-600">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
