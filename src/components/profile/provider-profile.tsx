import Image from "next/image";

export default function ProviderProfile() {
  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            <div className="relative h-16 w-16 overflow-hidden rounded-full border border-slate-200">
              <Image
                src="/img/02.jpg"
                alt="Alex Rivera"
                fill
                className="object-cover"
              />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-xl font-semibold text-slate-900">Alex Rivera</h1>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Verified Student
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-500">Computer Science - Stanford University</p>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    ★
                  </span>
                  <span className="font-semibold text-emerald-700">4.9</span>
                  <span className="text-slate-500">(128 reviews)</span>
                </div>
                <span className="text-slate-400">|</span>
                <span className="font-semibold text-slate-700">34 swaps</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            ✓
          </span>
          <div>
            <h2 className="text-sm font-semibold text-emerald-800">Identity Verified</h2>
            <p className="text-xs text-emerald-700">
              University email has been verified by Skill Swap Hub
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-600">
              i
            </span>
            About Alex
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Hey there! I am a Computer Science student passionate about building clean
            interfaces and scalable backend systems. I have spent the last three years
            honing my Python and React skills through internships and personal projects. I
            love explaining complex concepts in simple terms and believe the best way to
            learn is to teach someone else. When I am not coding, you can find me at the
            campus climbing wall or volunteering as a math tutor.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              ✓
            </span>
            Skills I Can Offer
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              "Python & Django",
              "UI/UX Design",
              "Figma",
              "C++ Fundamentals",
              "Mobile App Dev",
            ].map((skill) => (
              <span
                key={skill}
                className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-600">
              ✦
            </span>
            Recent Reviews
          </div>
          <button className="text-xs font-semibold text-blue-600 hover:text-blue-700">
            View All 34 Reviews
          </button>
        </div>

        <div className="mt-4 grid gap-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between text-sm">
              <p className="font-semibold text-slate-900">Sarah Chen</p>
              <span className="font-semibold text-emerald-700">★ 5.0</span>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              "Alex is an amazing Python tutor! He explained list comprehensions in a
              way that finally clicked for me. In return, I helped him with his Tableau
              dashboard. Truly a great exchange."
            </p>
            <p className="mt-3 text-xs text-slate-500">Oct 12, 2023 - Python & Django swap</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between text-sm">
              <p className="font-semibold text-slate-900">Jordan Smith</p>
              <span className="font-semibold text-emerald-700">★ 4.5</span>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              "Very patient and knowledgeable about UI design. We spent two hours
              going over mobile app flows. He is very professional and punctual."
            </p>
            <p className="mt-3 text-xs text-slate-500">Sep 28, 2023 - UI/UX Design swap</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            ●
          </span>
          Available for Swaps
        </div>
        <p className="mt-2 text-xs text-slate-500">Usually responds within 2 hours</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {"Mon,Tue,Wed,Thu,Fri,Sat".split(",").map((day) => (
            <span
              key={day}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                day === "Tue" || day === "Wed" || day === "Fri"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {day}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
