"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { registerUser } from "@/lib/auth";
import {
  isAllowedStudentProofFile,
  STUDENT_PROOF_ACCEPT,
  STUDENT_PROOF_TYPES,
} from "@/lib/platform";
import UniversityCombobox from "@/components/ui/university-combobox";
import SelectField from "@/components/ui/select-field";
import { useLookupOptions } from "@/lib/lookups";

const strongPasswordMessage =
  "Use a strong password with at least 6 characters, including uppercase, lowercase, a number, and a symbol.";

const strongPasswordSchema = z
  .string()
  .min(6, strongPasswordMessage)
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/,
    strongPasswordMessage,
  );

// The same schema powers validation messages and the TypeScript form type.
const registerSchema = z
  .object({
    accountType: z.enum(["student", "non-student"]),
    name: z.string().min(2, "Enter your full name."),
    email: z.string().email("Enter a valid email."),
    phoneNumber: z.string().optional(),
    password: strongPasswordSchema,
    confirmPassword: z.string().min(6, "Please confirm your password."),
    university: z.string().optional(),
    degree: z.string().optional(),
    yearOfStudy: z.string(),
    proofType: z.enum(STUDENT_PROOF_TYPES),
    proofFile: z.custom<File | undefined>().optional(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  })
  .superRefine((value, ctx) => {
    if (value.accountType !== "student") return;

    if (!value.university?.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["university"],
        message: "Select your university.",
      });
    }

    if (!value.degree?.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["degree"],
        message: "Enter your degree programme.",
      });
    }

    if (!value.proofFile) {
      ctx.addIssue({
        code: "custom",
        path: ["proofFile"],
        message: "Upload your student proof document.",
      });
      return;
    }

    if (!isAllowedStudentProofFile(value.proofFile)) {
      ctx.addIssue({
        code: "custom",
        path: ["proofFile"],
        message: "Upload a PDF, DOC, PNG, JPG, or JPEG file under 8 MB.",
      });
    }
  });

type RegisterValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const yearOptions = useLookupOptions("yearOfStudyOptions");
  const proofFileInputRef = useRef<HTMLInputElement | null>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    clearErrors,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      accountType: "student",
      yearOfStudy: "1st Year",
      proofType: "Student ID",
    },
  });

  const onSubmit = async (data: RegisterValues) => {
    setLoading(true);
    setServerError("");
    try {
      if (data.accountType === "student") {
        if (!data.university || !data.degree || !data.proofFile) {
          throw new Error("Please complete the student verification details.");
        }

        await registerUser({
          accountType: "student",
          name: data.name,
          email: data.email,
          password: data.password,
          phoneNumber: data.phoneNumber?.trim() || "",
          university: data.university,
          degree: data.degree,
          yearOfStudy: data.yearOfStudy,
          proofType: data.proofType,
          proofFile: data.proofFile,
        });
        router.push("/pending-verification?registered=true");
      } else {
        await registerUser({
          accountType: "non-student",
          name: data.name,
          email: data.email,
          password: data.password,
          phoneNumber: data.phoneNumber?.trim() || "",
        });
        router.push("/verify-email?from=buyer&registered=true");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Registration failed.";
      if (msg.includes("email-already-in-use")) {
        setServerError("This email is already registered. Please login.");
      } else if (
        msg.includes("storage/unauthorized") ||
        msg.includes("storage/unknown") ||
        msg.includes("Student proof must") ||
        msg.includes("Student proof upload timed out")
      ) {
        setServerError("Student proof upload failed. Please choose a PDF, DOC, DOCX, PNG, or JPG file and try again.");
      } else if (msg.includes("Account profile setup timed out") || msg.includes("Verification request setup timed out")) {
        setServerError("Your account was almost created, but saving the verification request took too long. Please try again.");
      } else {
        setServerError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const accountType = useWatch({ control, name: "accountType" }) || "student";
  const universityValue = useWatch({ control, name: "university" }) || "";
  const yearOfStudyValue = useWatch({ control, name: "yearOfStudy" }) || "1st Year";
  const proofTypeValue = useWatch({ control, name: "proofType" }) || "Student ID";
  const proofFileValue = useWatch({ control, name: "proofFile" });
  const passwordHintInErrorState =
    errors.password?.message === strongPasswordMessage ||
    errors.confirmPassword?.message === strongPasswordMessage;

  const clearProofFile = () => {
    setValue("proofFile", undefined, {
      shouldDirty: true,
      shouldValidate: true,
    });
    clearErrors("proofFile");
    if (proofFileInputRef.current) {
      proofFileInputRef.current.value = "";
    }
  };

  return (
    <main className="relative min-h-screen bg-[linear-gradient(140deg,#effdf9_0%,#dff4ff_48%,#f8fbff_100%)]">
      <div className="fixed inset-0 bg-[linear-gradient(120deg,rgba(13,148,136,0.16),rgba(37,99,235,0.12),rgba(255,255,255,0.2))] backdrop-blur-sm" aria-hidden="true" />
      <div className="relative z-10 mx-auto flex min-h-screen items-center justify-center px-6 py-10">
        <div className="grid w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl lg:grid-cols-[1.05fr_0.95fr]">
          {/* Buyer registration form */}
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
                Register as a student provider candidate or as a buyer.
              </p>

              {serverError && (
                <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 border border-red-200">
                  {serverError}
                </div>
              )}

              <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Registering As</label>
                  <div className="mt-2 grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1">
                    {[
                      { label: "Student", value: "student" },
                      { label: "Non-student", value: "non-student" },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          setValue("accountType", option.value as RegisterValues["accountType"], {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                        }
                        className={`cursor-pointer rounded-md px-3 py-2 text-xs font-semibold transition ${
                          accountType === option.value
                            ? "bg-white text-[#2b62e6] shadow-sm"
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                  <div className="grid min-w-0 gap-1.5">
                    <label className="text-xs font-semibold text-slate-600">Full Name</label>
                    <input
                      type="text"
                      placeholder="Your Full Name"
                      {...register("name")}
                      className="h-[46px] w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-[#2b62e6]"
                    />
                    {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
                  </div>
                  <div className="grid min-w-0 gap-1.5">
                    <label className="text-xs font-semibold text-slate-600">Email</label>
                    <input
                      type="email"
                      placeholder="name@example.com"
                      {...register("email")}
                      className="h-[46px] w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-[#2b62e6]"
                    />
                    {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                  <div className="grid min-w-0 gap-1.5">
                    <label className="text-xs font-semibold text-slate-600">Password</label>
                    <div className="relative flex h-[46px] items-center justify-between rounded-lg border border-slate-200 px-3">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        {...register("password")}
                        className="w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="ml-2 cursor-pointer text-slate-400 hover:text-slate-600 focus:outline-none"
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
                  <div className="grid min-w-0 gap-1.5">
                    <label className="text-xs font-semibold text-slate-600">Confirm Password</label>
                    <div className="relative flex h-[46px] items-center justify-between rounded-lg border border-slate-200 px-3">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm Password"
                        {...register("confirmPassword")}
                        className="w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="ml-2 cursor-pointer text-slate-400 hover:text-slate-600 focus:outline-none"
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

                {accountType === "student" ? (
                  <>
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
                      className="h-[46px]"
                    />

                    <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                      <div className="grid min-w-0 gap-1.5">
                        <label className="text-xs font-semibold text-slate-600">Degree Programme</label>
                        <input
                          type="text"
                          placeholder="Degree Programme Name"
                          {...register("degree")}
                          className="h-[46px] w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-[#2b62e6]"
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
                        options={yearOptions}
                        className="h-[46px] text-sm"
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:items-start">
                      <SelectField
                        label="Proof Type"
                        value={proofTypeValue}
                        onChange={(nextValue) =>
                          setValue("proofType", nextValue as RegisterValues["proofType"], {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                        }
                        options={[...STUDENT_PROOF_TYPES]}
                        className="h-[46px] text-sm"
                        labelClassName="leading-5"
                      />
                      <div className="grid min-w-0 gap-1.5 self-start">
                        <label className="text-xs font-semibold leading-5 text-slate-600">Student Proof Document</label>
                        <div className="grid gap-1.5">
                          <label className="grid h-[46px] cursor-pointer grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-slate-200 px-3 text-sm text-slate-500 transition hover:border-[#2b62e6]">
                            <span className="block min-w-0 truncate">
                              {proofFileValue?.name || "PDF, DOC, PNG, JPG"}
                            </span>
                            <span className="flex shrink-0 items-center gap-2">
                              {proofFileValue ? (
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    clearProofFile();
                                  }}
                                  className="inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-red-600"
                                  aria-label="Remove selected file"
                                >
                                  <CloseIcon className="h-3.5 w-3.5" />
                                </button>
                              ) : null}
                              <span className="text-xs font-semibold text-[#2b62e6]">
                                {proofFileValue ? "Change" : "Upload"}
                              </span>
                            </span>
                            <input
                              ref={proofFileInputRef}
                              type="file"
                              accept={STUDENT_PROOF_ACCEPT}
                              className="hidden"
                              onChange={(event) =>
                                setValue("proofFile", event.target.files?.[0], {
                                  shouldDirty: true,
                                  shouldValidate: true,
                                })
                              }
                            />
                          </label>
                        </div>
                        <div className="min-h-[20px]">
                          {errors.proofFile ? (
                            <p className="text-xs leading-5 text-red-500">{errors.proofFile.message}</p>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </>
                ) : null}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 flex h-[50px] w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#168bd8] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0f75bd] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading
                    ? "Creating Account..."
                    : accountType === "student"
                      ? "Create Student Account ->"
                      : "Create Buyer Account ->"}
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

          {/* Registration benefits */}
          <section className="flex items-center justify-center bg-[linear-gradient(145deg,#e9fbf6_0%,#e6f3ff_100%)] px-8 py-10">
            <div className="max-w-sm rounded-3xl bg-white/70 p-6 text-center shadow-sm">
              <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
                <Image src="/img/01.png" alt="Students working together" width={420} height={300} className="h-auto w-full object-cover" />
              </div>
              <div className="mt-5">
                <span className="inline-flex items-center gap-2 rounded-full bg-[#c9f3e8] px-3 py-1 text-xs font-semibold text-[#0f8a6b]">
                  <ShieldIcon className="h-3 w-3" />
                  Verified Student Providers
                </span>
                <h2 className="mt-3 text-lg font-semibold text-slate-900">Proof-based Provider Approval</h2>
                <p className="mt-2 text-xs text-slate-600">
                  Students can become providers after admin approval. Buyers can register with a normal email.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
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
