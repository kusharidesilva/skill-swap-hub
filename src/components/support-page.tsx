import Image from "next/image";

const categories = [
  {
    title: "Account & Profile",
    description:
      "Guidance on creating a student account, verifying university email, updating profile details, adding skills, and managing account settings.",
    tone: "bg-[#eef1ff] text-[#2b54d6]",
    icon: "user",
  },
  {
    title: "Safety & Security",
    description:
      "Learn how university email verification, private chat, ratings, reviews, and report options help maintain a trusted student-only environment.",
    tone: "bg-[#ffe9e1] text-[#ef6a42]",
    icon: "shield",
  },
  {
    title: "Skill Swapping",
    description:
      "Understand how to post skill offers, request services, find matching students, filter by ratings, and start a skill exchange with verified peers.",
    tone: "bg-[#e6fbf5] text-[#1caa88]",
    icon: "swap",
  },
  {
    title: "Payments & Private Agreements",
    description:
      "Skill Swap Hub does not process payments. If students agree on a paid service, payment discussions and slip sharing happen privately inside chat.",
    tone: "bg-[#fff1e6] text-[#f28643]",
    icon: "wallet",
  },
];

const faqs = [
  {
    question: "How do I verify my university email?",
    answer:
      "Students must register using their official university email address. A verification code will be sent to that email, and the student can access the platform only after entering the correct code.",
  },
  {
    question: "Is Skill Swap Hub only for university students?",
    answer:
      "Yes. Skill Swap Hub is designed for Sri Lankan university students. University email verification is used to help keep the platform student-only and trusted.",
  },
  {
    question: "How can I find a student for a service?",
    answer:
      "You can search by skill name, category, university, availability, rating, and review count. This helps you select the most suitable student for your required skill or service.",
  },
  {
    question: "How do ratings and reviews help?",
    answer:
      "Ratings and reviews show how reliable a student is based on previous exchanges. Students can use ratings to choose better service providers and avoid low-quality services.",
  },
  {
    question: "Does the platform handle payments?",
    answer:
      "No. Skill Swap Hub does not process bank transactions. If two students agree on a paid service, payment is handled outside the platform and the payment slip can be shared privately inside chat.",
  },
  {
    question: "What happens if a student takes money but does not complete the service?",
    answer:
      "The affected student can give a low rating, write a review, and report the issue. These ratings and reports help other students identify unreliable users.",
  },
  {
    question: "Can admin see private chats?",
    answer:
      "No. Admin does not normally view private chats. Admin can only review evidence if a student submits a report.",
  },
  {
    question: "Can I swap skills with students from other universities?",
    answer:
      "Yes. The platform supports skill exchange between verified students from different Sri Lankan universities.",
  },
];

export default function SupportPage() {
  return (
    <main className="bg-white">
      <section className="bg-[#eef1ff]">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 py-14 text-center lg:py-20">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#e3e9ff] px-3 py-1 text-xs font-semibold text-[#2b54d6]">
            <span className="h-2 w-2 rounded-full bg-[#2b54d6]" />
            Support Center
          </span>
          <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
            Skill Swap Hub Help & Support
          </h1>
          <p className="max-w-2xl text-sm text-slate-600">
            Find simple guides for account setup, university email verification, skill swapping,
            private chat, ratings, reviews, and safe student-to-student communication.
          </p>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <h2 className="text-xl font-semibold text-slate-900">Information Categories</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {categories.map((item) => (
              <div
                key={item.title}
                className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${item.tone}`}>
                  <CategoryIcon type={item.icon} className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">{item.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-4xl px-6 pb-6 pt-4 text-center">
          <h2 className="text-xl font-semibold text-slate-900">Frequently Asked Questions</h2>
          <p className="mt-2 text-sm text-slate-600">Quick reference for common community inquiries.</p>
        </div>
        <div className="mx-auto max-w-4xl px-6 pb-12">
          <div className="space-y-6 border-l-2 border-slate-200 pl-6">
            {faqs.map((faq, index) => (
              <div key={faq.question} className="relative">
                <div
                  className={`absolute -left-[34px] top-1.5 h-6 w-1 rounded-full ${
                    index === 0 ? "bg-[#0f4cbf]" : "bg-slate-300"
                  }`}
                />
                <h3 className="text-sm font-semibold text-slate-900">{faq.question}</h3>
                <p className="mt-2 text-sm text-slate-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white pb-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-8 rounded-3xl bg-[#0f4cbf] px-8 py-8 text-white shadow-lg lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <h2 className="text-xl font-semibold">Contact Information</h2>
              <p className="mt-3 text-sm text-white/85">
                Our support team is available to help students with account issues, verification
                problems, reports, and platform-related questions.
              </p>
              <div className="mt-6 grid gap-3 text-sm text-white/90">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15">@</span>
                  support@skillswap.lk
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15">☎</span>
                  Student Help Desk
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15">🕒</span>
                  Mon-Fri: 9AM - 6PM
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15">📍</span>
                  Colombo, Sri Lanka
                </div>
              </div>
            </div>
            <div className="overflow-hidden rounded-2xl bg-white/10">
              <Image
                src="/img/03.jpg"
                alt="Support team assisting a student"
                width={520}
                height={320}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function CategoryIcon({ type, className }: { type: string; className?: string }) {
  if (type === "shield") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M12 3l7 3v6c0 4.1-2.8 7.7-7 9-4.2-1.3-7-4.9-7-9V6l7-3z" />
        <path d="M9.5 12.5l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (type === "swap") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M7 7h11l-3-3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M17 17H6l3 3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7 7v10" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (type === "wallet") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M3 7h16a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
        <path d="M3 7V5a2 2 0 0 1 2-2h12" />
        <circle cx="17" cy="12" r="1.5" fill="currentColor" />
      </svg>
    );
  }

  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M8 10a4 4 0 1 0-4-4 4 4 0 0 0 4 4z" />
      <path d="M12 20c.5-3 3.3-5 6-5s5.5 2 6 5" />
      <path d="M2 20c.7-2.3 2.8-3.8 5.3-4" />
    </svg>
  );
}
