import Image from "next/image";

const categories = [
  {
    title: "Account & Profile",
    description:
      "Guidance on creating an account, verifying email, uploading student proof, updating profile details, adding services, and managing account settings.",
    tone: "bg-[#e7edff] text-[#2452da]",
    cardTone: "bg-white",
    icon: "user",
  },
  {
    title: "Safety & Security",
    description:
      "Learn how provider verification, private chat, ratings, reviews, and report options help maintain a trusted service environment.",
    tone: "bg-[#ffe8e3] text-[#f06447]",
    cardTone: "bg-[#f4f5ff]",
    icon: "shield",
  },
  {
    title: "Skill Swapping",
    description:
      "Understand how to post skill offers, request services, find matching providers, filter by ratings, and start a skill exchange with confidence.",
    tone: "bg-[#77efe0] text-[#087e78]",
    cardTone: "bg-[#ecfbfa]",
    icon: "swap",
  },
  {
    title: "Payments & Private Agreements",
    description:
      "Skill Swap Hub does not process payments. If users agree on a paid service, payment discussions and slip sharing happen privately inside chat.",
    tone: "bg-[#ffe9dc] text-[#bf642e]",
    cardTone: "bg-white",
    icon: "wallet",
  },
];

const faqs = [
  {
    question: "How do I verify my account?",
    answer:
      "Non-students verify ownership of their normal email through Firebase. Students upload proof such as a student ID or confirmation letter, then wait for admin approval before using provider features.",
  },
  {
    question: "Is Skill Swap Hub only for university students?",
    answer:
      "Buyers can be students or non-students. Only verified university students can become providers, and admin approval is required before they can sell services.",
  },
  {
    question: "How can I find a provider for a service?",
    answer:
      "You can search by skill name, category, university, availability, rating, and review count. This helps you select the most suitable provider for your required skill or service.",
  },
  {
    question: "How do ratings and reviews help?",
    answer:
      "Ratings and reviews show how reliable a provider is based on previous exchanges. Users can use that feedback to choose better service providers and avoid low-quality services.",
  },
  {
    question: "Does the platform handle payments?",
    answer:
      "No. Skill Swap Hub does not process bank transactions. If two users agree on a paid service, payment is handled outside the platform and the payment slip can be shared privately inside chat.",
  },
  {
    question:
      "What happens if a provider takes money but does not complete the service?",
    answer:
      "The affected user can give a low rating, write a review, and report the issue. These ratings and reports help others identify unreliable providers.",
  },
  {
    question: "Can admin see private chats?",
    answer:
      "No. Admin does not normally view private chats. Admin can only review evidence if a student submits a report.",
  },
  {
    question: "Can I request services from students at other universities?",
    answer:
      "Yes. The platform supports service requests and skill exchanges with verified student providers from different Sri Lankan universities.",
  },
];

export default function SupportPage() {
  return (
    <main className="bg-white">
      {/* Help page introduction */}
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
            Find simple guides for account setup, email verification, student
            proof review, skill swapping, private chat, ratings, reviews, and
            safe communication across the platform.
          </p>
        </div>
      </section>

      {/* Support categories */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <h2 className="text-[18px] font-semibold leading-none text-slate-900 sm:text-[19px]">
            Information Categories
          </h2>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {categories.map((item) => (
              <div
                key={item.title}
                className={`flex items-start gap-4 rounded-[14px] border border-[#d7def1] px-7 py-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${item.cardTone}`}
              >
                <div
                  className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] ${item.tone}`}
                >
                  <CategoryIcon
                    type={item.icon}
                    className="h-[17px] w-[17px]"
                  />
                </div>
                <div className="max-w-[25rem]">
                  <h3 className="text-[16px] font-semibold leading-[1.25] text-slate-900">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-[14px] leading-[1.55] text-slate-600">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Frequently asked questions */}
      <section className="bg-white">
        <div className="mx-auto max-w-4xl px-6 pb-6 pt-4 text-center">
          <h2 className="text-xl font-semibold text-slate-900">
            Frequently Asked Questions
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Quick reference for common community inquiries.
          </p>
        </div>
        <div className="mx-auto max-w-4xl px-6 pb-12">
          <div className="space-y-6 border-l-2 border-slate-200 pl-6">
            {faqs.map((faq) => (
              <div
                key={faq.question}
                className="group relative cursor-pointer transition-all duration-300 hover:translate-x-1 hover:scale-[1.02]"
              >
                <div className="absolute -left-8.5 top-1.5 h-6 w-1 rounded-full bg-slate-300 transition-all duration-300 group-hover:top-0 group-hover:h-10 group-hover:bg-[#0f4cbf]" />
                <h3 className="text-sm font-semibold text-slate-900 transition-colors duration-300 group-hover:text-[#0f4cbf]">
                  {faq.question}
                </h3>
                <p className="mt-2 text-sm text-slate-600 transition-colors duration-300 group-hover:text-slate-800">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact support options */}
      <section id="contact-section" className="bg-white pb-16 scroll-mt-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-8 rounded-[30px] bg-[#1654d1] px-10 py-10 text-white shadow-lg lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div className="max-w-[35rem]">
              <h2 className="text-[20px] font-semibold leading-tight sm:text-[21px]">
                Contact Information
              </h2>
              <p className="mt-4 max-w-[32rem] text-[14px] leading-[1.6] text-white/82">
                Our support team is available to help users with account
                issues, verification problems, reports, and platform-related
                questions.
              </p>
              <div className="mt-8 grid gap-x-8 gap-y-5 text-[14px] text-white/95 sm:grid-cols-2">
                <div className="flex items-center gap-3">
                  <MailIcon className="h-[18px] w-[18px] shrink-0" />
                  <span>support@skillswap.lk</span>
                </div>
                <div className="flex items-center gap-3">
                  <HelpDeskIcon className="h-[18px] w-[18px] shrink-0" />
                  <span>Platform Help Desk</span>
                </div>
                <div className="flex items-center gap-3">
                  <ClockIcon className="h-[18px] w-[18px] shrink-0" />
                  <span>Mon-Fri: 9AM - 6PM</span>
                </div>
              </div>
            </div>
            <div className="overflow-hidden rounded-[18px] bg-white/10 lg:justify-self-end">
              <Image
                src="/img/03.jpg"
                alt="Support team assisting a student"
                width={420}
                height={250}
                className="h-[210px] w-full object-cover sm:h-[230px] lg:h-[182px] lg:w-[330px]"
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function CategoryIcon({
  type,
  className,
}: {
  type: string;
  className?: string;
}) {
  if (type === "shield") {
    return (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path d="M12 3.25l6.5 2.8v5.8c0 4-2.7 7.47-6.5 8.75-3.8-1.28-6.5-4.75-6.5-8.75v-5.8l6.5-2.8z" />
        <path
          d="M9.4 12.35l1.9 1.9 3.7-3.95"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (type === "swap") {
    return (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path d="M7 7h9.5" strokeLinecap="round" />
        <path
          d="M13.5 4.5L17 7l-3.5 2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M17 17H7.5" strokeLinecap="round" />
        <path
          d="M10.5 14.5L7 17l3.5 2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M7 7v10" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === "wallet") {
    return (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path d="M4 7.25h14.5a1.75 1.75 0 0 1 1.75 1.75v6a1.75 1.75 0 0 1-1.75 1.75H5.5A1.5 1.5 0 0 1 4 15.25v-8z" />
        <path d="M4 7.25V5.8A1.8 1.8 0 0 1 5.8 4h10.95" />
        <path d="M15.5 11h4.75v2.5H15.5A1.25 1.25 0 0 1 14.25 12.25 1.25 1.25 0 0 1 15.5 11z" />
        <circle cx="16.75" cy="12.25" r="0.85" fill="currentColor" stroke="none" />
      </svg>
    );
  }

  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <circle cx="12" cy="8.1" r="3.4" />
      <path
        d="M6.4 18.2c0-3.1 2.5-5.25 5.6-5.25s5.6 2.15 5.6 5.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="8.1" r="1.35" />
    </svg>
  );
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M4 7.5h16v9H4z" />
      <path d="M5 8.5l7 5 7-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HelpDeskIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M5 7.5h14v9H5z" />
      <path d="M8 11h8" strokeLinecap="round" />
      <path d="M8 14h5" strokeLinecap="round" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4.5l3 1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
