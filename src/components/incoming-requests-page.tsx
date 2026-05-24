 "use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type IncomingRequestsTab = "new" | "accepted" | "completed" | "declined";

type IncomingRequestsPageContentProps = {
  activeTab?: IncomingRequestsTab;
  role?: "provider" | "both";
};

export default function IncomingRequestsPageContent({
  activeTab = "new",
  role = "provider",
}: IncomingRequestsPageContentProps) {
  const tabHref = (tab: IncomingRequestsTab) => `?tab=${tab}`;

  return (
    <section className="space-y-6 pb-10">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900 md:text-[2.9rem]">Skill Requests</h1>
        <p className="mt-2 text-lg text-slate-600">Manage requests from students needing your expertise.</p>
      </header>

      <div className="flex items-center gap-8 border-b border-slate-200">
        <TabLink href={tabHref("new")} label="New Requests" active={activeTab === "new"} />
        <TabLink href={tabHref("accepted")} label="Accepted" active={activeTab === "accepted"} />
        <TabLink href={tabHref("completed")} label="Completed" active={activeTab === "completed"} />
        <TabLink href={tabHref("declined")} label="Declined" active={activeTab === "declined"} />
      </div>

      {activeTab === "new" ? <NewRequestsView role={role} /> : null}
      {activeTab === "accepted" ? <AcceptedView role={role} /> : null}
      {activeTab === "completed" ? <CompletedView /> : null}
      {activeTab === "declined" ? <DeclinedView /> : null}
    </section>
  );
}

function TabLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`border-b-2 pb-3 text-[1.15rem] font-semibold ${
        active ? "border-[#1453c4] text-[#1453c4]" : "border-transparent text-slate-600"
      }`}
    >
      {label}
    </Link>
  );
}

function NewRequestsView({ role }: { role: "provider" | "both" }) {
  const [category, setCategory] = useState("All Categories");
  const [university, setUniversity] = useState("Any University");

  const requests = useMemo(
    () => [
      {
        id: "samith",
        name: "Samith Kumara",
        university: "University of Colombo",
        category: "Programming",
        degree: "BSc Computer Science, UoC",
        title: "Advanced Python Tutoring",
        description:
          "Looking for someone to help me understand machine learning algorithms using Python. Specifically focusing on scikit-learn and basic preprocessing techniques.",
      },
      {
        id: "nethmi",
        name: "Nethmi Perera",
        university: "University of Moratuwa",
        category: "Design",
        degree: "BDes Interaction Design, UoM",
        title: "Figma UI Design Support",
        description:
          "Need guidance on creating responsive dashboards in Figma with reusable components and clean auto-layout setup.",
      },
      {
        id: "hashan",
        name: "Hashan Silva",
        university: "SLIIT",
        category: "Programming",
        degree: "BSc Software Engineering, SLIIT",
        title: "React State Management Help",
        description:
          "Need support with React state structure and reusable component patterns for a medium-size project.",
      },
    ],
    [],
  );

  const filteredRequests = requests.filter((request) => {
    const categoryOk = category === "All Categories" || request.category === category;
    const universityOk = university === "Any University" || request.university === university;
    return categoryOk && universityOk;
  });

  const activeRequest = filteredRequests[0] ?? requests[0];

  return (
    <div className="grid gap-4 xl:grid-cols-[340px_minmax(0,1fr)]">
      <article className="rounded-xl border border-slate-200 bg-[#f7f8ff] p-5 shadow-sm">
        <h2 className="text-[2rem] font-semibold text-slate-900">Filters</h2>
        <div className="mt-4 space-y-4">
          <Field
            label="Category"
            value={category}
            options={["All Categories", "Programming", "Design"]}
            onChange={setCategory}
          />
          <Field
            label="University"
            value={university}
            options={["Any University", "University of Colombo", "University of Moratuwa", "SLIIT"]}
            onChange={setUniversity}
          />
        </div>
      </article>

      <article className="rounded-xl border border-slate-200 bg-[#f7f8ff] p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-lg font-semibold text-slate-800">
              SK
            </div>
            <div>
              <p className="text-2xl font-semibold text-slate-900">{activeRequest.name}</p>
              <p className="text-base text-slate-600">{activeRequest.degree}</p>
            </div>
          </div>
          <span className="rounded-full bg-teal-100 px-4 py-1 text-base font-semibold text-teal-700">92% Match</span>
        </div>

        <div className="pt-4">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Skill Needed</p>
          <p className="mt-1 text-[1.9rem] font-semibold text-[#1453c4]">{activeRequest.title}</p>
          <p className="mt-2 max-w-3xl text-lg leading-8 text-slate-700">
            {activeRequest.description}
          </p>
          <p className="mt-3 text-base text-slate-600">This Weekend  |  Will trade Design skills</p>
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-slate-200 pt-4">
          <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white p-2">
            <button className="rounded-lg bg-[#2f66e7] px-4 py-2 text-base font-semibold text-white">Accept</button>
            <button className="rounded-lg px-3 py-2 text-base font-semibold text-slate-700">Decline</button>
          </div>
          <div className="flex items-center gap-5 text-base font-semibold">
            <Link href={`/chats/${role}`} className="text-[#1453c4]">
              Chat
            </Link>
            <Link href="/provider-profile/sample" className="text-slate-700">
              Profile
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
}

function AcceptedView({ role }: { role: "provider" | "both" }) {
  const cards = [
    {
      id: "malith-perera",
      name: "Malith Perera",
      uni: "University of Colombo",
      skill: "React Development",
      time: "Tomorrow, 4:00 PM",
    },
    {
      id: "sara-jayawardena",
      name: "Sara Jayawardena",
      uni: "SLIIT University",
      skill: "UI/UX Design Essentials",
      time: "Friday, 10:30 AM",
    },
    {
      id: "arjun-raman",
      name: "Arjun Raman",
      uni: "University of Moratuwa",
      skill: "SQL Advanced Queries",
      time: "Saturday, 2:00 PM",
    },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {cards.map((item) => (
        <article key={item.id} className="rounded-xl border border-slate-300 bg-white p-3.5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[1.35rem] font-semibold leading-tight text-slate-900">{item.name}</p>
              <p className="text-sm text-slate-600">{item.uni}</p>
            </div>
            <span className="rounded-full bg-teal-100 px-3 py-1 text-sm font-semibold text-teal-700">Accepted</span>
          </div>
          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Requested Skill</p>
          <p className="mt-1 text-[1.25rem] font-semibold text-[#1453c4]">{item.skill}</p>
          <div className="mt-3 rounded-lg bg-[#f3f4ff] p-2.5">
            <p className="text-sm text-slate-500">Scheduled For</p>
            <p className="text-[1.2rem] font-semibold text-slate-900">{item.time}</p>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Link
              href={`/chats/${role}`}
              className="flex-1 rounded-lg bg-[#1453c4] px-3 py-2 text-center text-sm font-semibold text-white"
            >
              Chat
            </Link>
            <Link
              href={`/provider-profile/${item.id}`}
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-center text-sm font-semibold text-slate-700"
            >
              View Details
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}

function CompletedView() {
  const cards = [
    { name: "Elena Rodriguez", uni: "Computer Science Junior", skill: "Python Data Analysis", review: "Elena was incredibly patient explaining NumPy and Pandas. I finally understand dataframes!" },
    { name: "Marcus Thorne", uni: "Architecture Senior", skill: "3D Modeling (Rhino)", review: "Great session. Marcus has a deep understanding of Rhino. Fixed my rendering workflow quickly." },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {cards.map((item) => (
        <article key={item.name} className="rounded-xl border border-slate-300 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[1.9rem] font-semibold text-slate-900">{item.name}</p>
              <p className="text-base text-slate-600">{item.uni}</p>
            </div>
            <span className="rounded-full bg-teal-100 px-3 py-1 text-base font-semibold text-teal-700">Completed</span>
          </div>
          <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-slate-500">Exchanged Skill</p>
          <p className="mt-1 text-[1.6rem] font-semibold text-teal-700">{item.skill}</p>
          <div className="mt-3 rounded-lg bg-[#f3f4ff] p-3">
            <div className="flex items-center justify-between">
              <p className="text-lg text-slate-700">Review Received</p>
              <p className="text-lg text-amber-600">★★★★★</p>
            </div>
            <p className="mt-2 text-lg italic text-slate-700">&quot;{item.review}&quot;</p>
          </div>
          <button className="mt-4 w-full rounded-lg border border-[#1453c4] px-3 py-2 text-base font-semibold text-[#1453c4]">
            View Full Review
          </button>
        </article>
      ))}
    </div>
  );
}

function DeclinedView() {
  const items = [
    { name: "Jordan Davis", skill: "Advanced React Patterns", date: "Oct 24, 2023", reason: "Conflict in schedule" },
    { name: "Sarah Chen", skill: "Conversational Mandarin", date: "Oct 21, 2023", reason: "Seeking different proficiency level" },
    { name: "Marcus Thompson", skill: "Digital Illustration in Procreate", date: "Oct 15, 2023", reason: "Required hardware not available" },
  ];

  return (
    <section className="space-y-4">
      <div className="flex justify-end">
        <button className="text-base font-semibold text-red-600">Clear History</button>
      </div>
      {items.map((item) => (
        <article key={item.name} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-lg bg-slate-200" />
            <div>
              <p className="text-[1.8rem] font-semibold text-slate-900">{item.name}</p>
              <p className="text-[1.45rem] text-slate-700">{item.skill}</p>
              <p className="mt-1 text-sm text-slate-600">Declined: {item.date}  |  {item.reason}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="rounded-lg border border-slate-400 px-4 py-2 text-base font-semibold text-slate-700">
              View Original Request
            </button>
            <button className="text-slate-500">Delete</button>
          </div>
        </article>
      ))}
    </section>
  );
}

function Field({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-base font-semibold text-slate-700">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-12 w-full rounded-lg border border-slate-300 bg-white px-3 text-lg font-normal text-slate-700 outline-none"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
