import Link from "next/link";
import Image from "next/image";

export default function BecomeSellerModal() {
  return (
    <div className="min-h-screen bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative">
        {/* Close Button */}
        <button
          title="Close"
          className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 z-10"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 md:p-12">
          {/* Left Panel */}
          <div className="flex flex-col justify-between">
            {/* Badge */}
            <div className="inline-flex mb-6">
              <span className="bg-teal-100 text-teal-700 text-xs font-bold px-3 py-1 rounded-full">
                BECOME A PROVIDER
              </span>
            </div>

            {/* Title */}
            <div className="mb-8">
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-2">
                Complete Your
              </h1>
              <h1 className="text-4xl md:text-5xl font-bold text-blue-600 mb-4">
                Provider Profile
              </h1>
            </div>

            {/* Image */}
            <div className="mb-8 rounded-2xl overflow-hidden h-56 md:h-64 relative bg-slate-100">
              <Image
                src="/img/provider-profile.png"
                alt="Empower your peers"
                fill
                className="object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/60 to-transparent p-4">
                <p className="text-white text-sm italic">
                  Empower your peers across Sri Lankan universities.
                </p>
              </div>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="border border-slate-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <svg
                    className="w-5 h-5 text-teal-600"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                  </svg>
                  <h3 className="font-semibold text-slate-900">
                    Trusted Network
                  </h3>
                </div>
                <p className="text-sm text-slate-600">
                  Verified profiles from recognized Sri Lankan universities.
                </p>
              </div>

              <div className="border border-slate-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <svg
                    className="w-5 h-5 text-teal-600"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
                  </svg>
                  <h3 className="font-semibold text-slate-900">
                    Flexible Earns
                  </h3>
                </div>
                <p className="text-sm text-slate-600">
                  Swap for skills or set your preferred rates.
                </p>
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div className="flex flex-col justify-between">
            {/* Setup Progress */}
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-6">
                Setup Progress
              </h2>

              {/* Step 1 */}
              <div className="flex gap-4 mb-8">
                <div className="shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white font-bold">
                    1
                  </div>
                </div>
                <div className="grow">
                  <h3 className="font-semibold text-slate-900 mb-1">
                    Verify Identity
                  </h3>
                  <p className="text-sm text-slate-600">
                    Use your official university email to build immediate trust.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4 mb-8">
                <div className="shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-300 text-slate-600 font-bold">
                    2
                  </div>
                </div>
                <div className="grow">
                  <h3 className="font-semibold text-slate-900 mb-1">
                    List Skills
                  </h3>
                  <p className="text-sm text-slate-600">
                    Define what you&apos;re good at. Programming, Photography,
                    or even Designing.
                  </p>
                  <div className="flex gap-2 mt-2">
                    <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded">
                      Web Dev
                    </span>
                    <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded">
                      Math
                    </span>
                    <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded">
                      Add Skill +
                    </span>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4 mb-8">
                <div className="shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-300 text-slate-600 font-bold">
                    3
                  </div>
                </div>
                <div className="grow">
                  <h3 className="font-semibold text-slate-900 mb-1">
                    Set Availability
                  </h3>
                  <p className="text-sm text-slate-600">
                    Manage schedule by marking specific hours you&apos;re free
                    to teach.
                  </p>
                </div>
              </div>
            </div>

            {/* Button and Terms */}
            <div className="space-y-4 pt-6 border-t border-slate-200">
              <Link
                href="/become-a-seller"
                className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg text-center transition duration-200"
              >
                Let&apos;s Get Started
              </Link>

              <p className="text-xs text-slate-600 text-center">
                By proceeding, you agree to our{" "}
                <a
                  href="#"
                  className="text-blue-600 hover:text-blue-700 font-semibold"
                >
                  Terms of Provider Service
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
