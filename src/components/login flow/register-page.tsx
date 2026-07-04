"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { registerBuyer } from "@/lib/auth";
import { isEmailAllowedForUniversity } from "@/lib/universities";
import UniversityCombobox from "@/components/ui/university-combobox";
import SelectField from "@/components/ui/select-field";

const strongPasswordMessage =
  "Use a strong password with at least 6 characters, including uppercase, lowercase, a number, and a symbol.";

const strongPasswordSchema = z
  .string()
  .min(6, strongPasswordMessage)
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/,
    strongPasswordMessage,
  );

const registerSchema = z
  .object({
    name: z.string().min(2, "Enter your full name."),
    email: z.string().email("Enter a valid university email."),
    password: strongPasswordSchema,
    confirmPassword: z.string().min(6, "Please confirm your password."),
    university: z.string().min(1, "Select your university."),
    degree: z.string().min(2, "Enter your degree programme."),
    yearOfStudy: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  })
  .refine((v) => {
    if (!v.university) return true;
    return isEmailAllowedForUniversity(v.email, v.university);
  }, {
    message: "Email domain does not match the selected university.",
    path: ["email"],
  });

type RegisterValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { yearOfStudy: "1st Year" },
  });

  const onSubmit = async (data: RegisterValues) => {
    setLoading(true);
    setServerError("");
    try {
      await registerBuyer({
        name: data.name,
        email: data.email,
        password: data.password,
        university: data.university,
        degree: data.degree,
        yearOfStudy: data.yearOfStudy,
      });
      router.push("/verify-email?from=buyer&registered=true");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Registration failed.";
      if (msg.includes("email-already-in-use")) {
        setServerError("This email is already registered. Please login.");
      } else {
        setServerError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const universityValue = useWatch({ control, name: "university" }) || "";
  const yearOfStudyValue = useWatch({ control, name: "yearOfStudy" }) || "1st Year";
  const passwordHintInErrorState =
    errors.password?.message === strongPasswordMessage ||
    errors.confirmPassword?.message === strongPasswordMessage;

  return (
    <main className="relative min-h-screen bg-white">
      <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" aria-hidden="true" />
      <div className="relative z-10 mx-auto flex min-h-screen items-center justify-center px-6 py-10">
        <div className="grid w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl lg:grid-cols-[1.05fr_0.95fr]">
          <section className="relative bg-white px-10 py-10">
            <Link
              href="/"
              aria-label="Close"
              className="absolute right-6 top-6 inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
            >
              <CloseIcon className="h-4 w-4" />
            </Link>

            <div className="max-w-md">
              <h1 className="text-2xl font-semibold text-slate-900">Create Your Account</h1>
              <p className="mt-2 text-sm text-slate-600">
                Empower your journey through peer-to-peer knowledge exchange.
              </p>

              {serverError && (
                <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 border border-red-200">
                  {serverError}
                </div>
              )}

              <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-600">Full Name</label>
                    <input
                      type="text"
                      placeholder="Your Full Name"
                      {...register("name")}
                      className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-[#2b62e6]"
                    />
                    {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600">University Email</label>
                    <input
                      type="email"
                      placeholder="mail@uni.ac.lk"
                      {...register("email")}
                      className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-[#2b62e6]"
                    />
                    {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-lg bg-[#eef2ff] px-3 py-3 text-xs text-slate-600">
                  <InfoIcon className="mt-0.5 h-4 w-4 text-[#2b54d6]" />
                  <span>
                    Use your official university email address. A verification code will be sent to this
                    email to ensure you are a verified university student.
                  </span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-600">Password</label>
                    <div className="relative mt-2 flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        {...register("password")}
                        className="w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-slate-400 hover:text-slate-600 focus:outline-none ml-2"
                      >
                        {showPassword ? (
                          <EyeOffIcon className="h-4 w-4" />
                        ) : (
                          <EyeIcon className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {errors.password && errors.password.message !== strongPasswordMessage && (
                      <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600">Confirm Password</label>
                    <div className="relative mt-2 flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm Password"
                        {...register("confirmPassword")}
                        className="w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="text-slate-400 hover:text-slate-600 focus:outline-none ml-2"
                      >
                        {showConfirmPassword ? (
                          <EyeOffIcon className="h-4 w-4" />
                        ) : (
                          <EyeIcon className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {errors.confirmPassword &&
                      errors.confirmPassword.message !== strongPasswordMessage && (
                        <p className="mt-1 text-xs text-red-500">{errors.confirmPassword.message}</p>
                      )}
                  </div>
                </div>
                <p className={`text-xs ${passwordHintInErrorState ? "text-red-500" : "text-slate-500"}`}>
                  {strongPasswordMessage}
                </p>

                <UniversityCombobox
                  label="University Name"
                  value={universityValue}
                  onSelect={(nextValue) =>
                    setValue("university", nextValue, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                  placeholder="Type or select your University"
                  error={errors.university?.message}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-600">Degree Programme</label>
                    <input
                      type="text"
                      placeholder="Degree Programme Name"
                      {...register("degree")}
                      className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-[#2b62e6]"
                    />
                    {errors.degree && <p className="mt-1 text-xs text-red-500">{errors.degree.message}</p>}
                  </div>
                  <SelectField
                    label="Year of Study"
                    value={yearOfStudyValue}
                    onChange={(nextValue) =>
                      setValue("yearOfStudy", nextValue, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                    options={["1st Year", "2nd Year", "3rd Year", "4th Year"]}
                    className="text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-[#2b62e6] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1f55cc] disabled:opacity-60"
                >
                  {loading ? "Creating Account..." : "Create Student Account →"}
                </button>

                <p className="text-center text-xs text-slate-500">
                  Already have an account?{" "}
                  <Link href="/login" className="font-semibold text-[#0f4cbf]">
                    Login
                  </Link>
                </p>
              </form>
            </div>
          </section>

          <section className="flex items-center justify-center bg-[#eef1ff] px-8 py-10">
            <div className="max-w-sm rounded-3xl bg-[#e4e9ff] p-6 text-center shadow-sm">
              <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
                <Image src="/img/01.png" alt="Students working together" width={420} height={300} className="h-auto w-full object-cover" />
              </div>
              <div className="mt-5">
                <span className="inline-flex items-center gap-2 rounded-full bg-[#c9f3e8] px-3 py-1 text-xs font-semibold text-[#0f8a6b]">
                  <ShieldIcon className="h-3 w-3" />
                  Verified University Network
                </span>
                <h2 className="mt-3 text-lg font-semibold text-slate-900">Exclusively for Students</h2>
                <p className="mt-2 text-xs text-slate-600">
                  Skill Swap Hub is a secure system reserved for verified university students across Sri Lanka.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v.5" strokeLinecap="round" />
      <path d="M12 11v5" strokeLinecap="round" />
    </svg>
  );
}
function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M12 3l7 3v6c0 4.1-2.8 7.7-7 9-4.2-1.3-7-4.9-7-9V6l7-3z" />
      <path d="M9.5 12.5l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M6 6l12 12" strokeLinecap="round" />
      <path d="M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}
