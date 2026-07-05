import Link from "next/link"; 

export default function DashboardPage() { 
  return (
    <main className="min-h-screen bg-[#f5f7ff] px-6 py-16 text-slate-900"> 
      <section className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"> 
        <h1 className="text-2xl font-semibold">Choose Dashboard</h1> 
        <p className="mt-2 text-sm text-slate-600"> 
          Open the dashboard that matches the user account type. 
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3"> 
          <Link 
            href="/dashboard/buyer" 
            className="rounded-xl border border-slate-200 p-4 font-semibold text-slate-700 transition hover:border-[#2f66e7] hover:text-[#2f66e7]" 
          > 
            Buyer 
          </Link> 
          <Link 
            href="/dashboard/provider"  
            className="rounded-xl border border-slate-200 p-4 font-semibold text-slate-700 transition hover:border-[#2f66e7] hover:text-[#2f66e7]" 
          > 
            Provider 
          </Link> 
          <Link 
            href="/dashboard/both" 
            className="rounded-xl border border-slate-200 p-4 font-semibold text-slate-700 transition hover:border-[#2f66e7] hover:text-[#2f66e7]" 
          > 
            Both 
          </Link> 
        </div> 
      </section> 
    </main> 
  );
}
