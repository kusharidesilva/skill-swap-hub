"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { doc, serverTimestamp, setDoc, writeBatch } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import type { ProviderGig } from "@/lib/auth";
import SelectField from "@/components/ui/select-field";
import { AVAILABILITY_DAYS, AVAILABILITY_TIME_SLOTS } from "@/lib/platform";
import { useLookupOptions } from "@/lib/lookups";

const DELIVERY_OPTIONS = ["1 Day", "2 Days", "3 Days", "5 Days", "7 Days", "14 Days"];
const MAX_SAMPLE_IMAGE_BYTES = 2 * 1024 * 1024;
const SAMPLE_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

type PostNewGigPageProps = {
  role: "provider" | "both";
  mode?: "create" | "edit";
  gigId?: string;
};

export default function PostNewGigPage({ role, mode = "create", gigId }: PostNewGigPageProps) {
  const router = useRouter();
  const { userProfile, refreshProfile } = useAuth();
  const isEditMode = mode === "edit";
  const serviceCategories = useLookupOptions("serviceCategories");
  const timeSlotOptions = useLookupOptions("availabilityTimeSlots");
  const availabilityOptions = AVAILABILITY_DAYS.flatMap((day) =>
    (timeSlotOptions.length ? timeSlotOptions : [...AVAILABILITY_TIME_SLOTS]).map(
      (slot) => `${day} ${slot}`,
    ),
  );

  // Edit routes use "gig-N", so this converts the URL value back to an array index.
  const skillIndex =
    isEditMode && gigId ? parseInt(gigId.replace("gig-", ""), 10) : -1;

  // Main gig details are kept together so create and edit mode share one form.
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(serviceCategories[0] || "Photography");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [delivery, setDelivery] = useState(DELIVERY_OPTIONS[0]);
  const [selectedImage, setSelectedImage] = useState("/img/package%201.jpg");
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [availability, setAvailability] = useState<string[]>([]);

  // Tags use a separate input because users can add several values.
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  // These values only control validation and progress feedback.
  const [isSaving, setIsSaving] = useState(false);
  const [didAttemptSubmit, setDidAttemptSubmit] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const backHref =
    role === "both" ? "/my-gigs/both?tab=manage" : "/my-gigs/provider?tab=manage";
  const selectedCategory = serviceCategories.includes(category)
    ? category
    : serviceCategories[0] || "Photography";

  // Edit mode copies the selected saved gig into the form once the profile loads.
  useEffect(() => {
    if (!isEditMode || !userProfile || skillIndex < 0) return;
    const gigs = userProfile.providerProfile?.gigs || [];
    const existingGig = gigs[skillIndex];
    const skills = userProfile.providerProfile?.skills || [];
    const legacySkill = skills[skillIndex];
    const resolvedTitle = existingGig?.title || legacySkill;
    if (!resolvedTitle) return;
    
    const timer = setTimeout(() => {
      setTitle(resolvedTitle);
      setCategory(existingGig?.category || serviceCategories[0] || "Photography");
      setSummary(existingGig?.summary || "");
      setDescription(existingGig?.description || "");
      setPrice(existingGig?.price ? String(existingGig.price) : "");
      setDelivery(existingGig?.delivery || DELIVERY_OPTIONS[0]);
      setTags(existingGig?.tags || []);
      setAvailability(existingGig?.availability || userProfile.providerProfile?.availability || []);
      
      const gigImages = userProfile.providerProfile?.gigImages || [];
      if (existingGig?.image) {
        setSelectedImage(existingGig.image);
      } else if (gigImages[skillIndex]) {
        setSelectedImage(gigImages[skillIndex]);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [isEditMode, userProfile, skillIndex, serviceCategories]);

  useEffect(() => {
    if (!userProfile) return;
    const timer = setTimeout(() => {
      setAvailability((current) => current.length ? current : (userProfile.providerProfile?.availability || []));
    }, 0);

    return () => clearTimeout(timer);
  }, [userProfile]);

  const addTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed) && tags.length < 5) {
      setTags([...tags, trimmed]);
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => setTags(tags.filter((t) => t !== tag));

  const toggleAvailability = (slot: string) => {
    setAvailability((current) =>
      current.includes(slot) ? current.filter((value) => value !== slot) : [...current, slot],
    );
  };

  const isTitleInvalid = didAttemptSubmit && !title.trim();
  const isSummaryInvalid = didAttemptSubmit && !summary.trim();
  const normalizedPrice = Number(price);
  const isPriceInvalid = didAttemptSubmit && (!price.trim() || !Number.isFinite(normalizedPrice) || normalizedPrice <= 0);

  const resolveSampleImage = async (gigDocumentId: string) => {
    if (!userProfile || !selectedImageFile) return selectedImage;

    if (
      !SAMPLE_IMAGE_TYPES.has(selectedImageFile.type) ||
      selectedImageFile.size > MAX_SAMPLE_IMAGE_BYTES
    ) {
      throw new Error("Sample work image must be PNG, JPG, or WEBP and under 2 MB.");
    }

    const safeName = selectedImageFile.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const storagePath = `gig-samples/${userProfile.uid}/${gigDocumentId}-${safeName}`;
    const imageRef = ref(storage, storagePath);
    await uploadBytes(imageRef, selectedImageFile, { contentType: selectedImageFile.type });
    return getDownloadURL(imageRef);
  };

  const handlePublish = async () => {
    if (!userProfile) return;

    setDidAttemptSubmit(true);

    if (!title.trim() || !summary.trim() || !price.trim() || !Number.isFinite(normalizedPrice) || normalizedPrice <= 0) {
      setFeedback({
        type: "error",
        msg: "Please fill in the required fields highlighted in red.",
      });
      return;
    }

    setIsSaving(true);
    setFeedback(null);
    setDidAttemptSubmit(false);

    try {
      if (
        userProfile.providerVerificationStatus !== "approved" ||
        userProfile.canSellServices !== true
      ) {
        throw new Error("Your provider account must be approved before you can publish gigs.");
      }

      const userRef = doc(db, "users", userProfile.uid);
      const existingSkills: string[] = [...(userProfile.providerProfile?.skills || [])];
      const existingImages: string[] = [...(userProfile.providerProfile?.gigImages || [])];
      const existingGigs: ProviderGig[] = [...(userProfile.providerProfile?.gigs || [])];
      const existingGigId = isEditMode && skillIndex >= 0 ? existingGigs[skillIndex]?.id : undefined;
      const gigDocumentId =
        existingGigId || `${userProfile.uid}-${Date.now()}-${slugify(title.trim() || "gig")}`;
      const imageUrl = await resolveSampleImage(gigDocumentId);

      const gigLabel = title.trim();
      const gigData: ProviderGig = {
        id: gigDocumentId,
        title: gigLabel,
        category: selectedCategory,
        summary: summary.trim(),
        description: description.trim(),
        price: normalizedPrice,
        delivery,
        availability,
        tags,
        image: imageUrl,
        sampleWorkUrl: imageUrl,
        status: "active",
      };

      // Pad the image list so each skill keeps the image at the same index.
      while (existingImages.length < existingSkills.length) {
        existingImages.push("/img/package%201.jpg");
      }
      while (existingGigs.length < existingSkills.length) {
        existingGigs.push({
          title: existingSkills[existingGigs.length] || gigLabel,
          category: selectedCategory,
          summary: summary.trim(),
          description: description.trim(),
          delivery,
          availability,
          tags,
          image: imageUrl,
        });
      }

      if (isEditMode && skillIndex >= 0) {
        // Edit only the selected gig and leave the rest of the profile untouched.
        existingSkills[skillIndex] = gigLabel;
        existingImages[skillIndex] = imageUrl;
        existingGigs[skillIndex] = gigData;
      } else {
        // New gigs are appended to the provider's existing list.
        if (existingSkills.includes(gigLabel)) {
          setFeedback({ type: "error", msg: "A gig with this title already exists." });
          setIsSaving(false);
          return;
        }
        existingSkills.push(gigLabel);
        existingImages.push(imageUrl);
        existingGigs.push(gigData);
      }

      const batch = writeBatch(db);
      batch.update(userRef, {
        "providerProfile.skills": existingSkills,
        "providerProfile.gigImages": existingImages,
        "providerProfile.availability": availability,
        "providerProfile.gigs": existingGigs,
      });

      const gigRef = doc(db, "gigs", gigDocumentId);
      batch.set(
        gigRef,
        {
          gigId: gigDocumentId,
          providerId: userProfile.uid,
          providerName: userProfile.name || "Provider",
          university: userProfile.university || "",
          degreeName: userProfile.degree || "",
          yearOfStudy: userProfile.yearOfStudy || "",
          categoryId: slugify(selectedCategory),
          category: selectedCategory,
          title: gigLabel,
          description: description.trim() || summary.trim(),
          summary: summary.trim(),
          price: normalizedPrice,
          currency: "LKR",
          availability,
          sampleWorkUrl: imageUrl,
          image: imageUrl,
          tags,
          delivery,
          gigStatus: "active",
          status: "active",
          updatedAt: serverTimestamp(),
          ...(existingGigId ? {} : { createdAt: serverTimestamp() }),
        },
        { merge: true },
      );

      await batch.commit();

      await refreshProfile();

      setFeedback({
        type: "success",
        msg: isEditMode
          ? "Gig updated successfully! Redirecting..."
          : "Gig published successfully! Redirecting...",
      });

      setTimeout(() => {
        router.push(backHref);
      }, 1500);
    } catch (err) {
      console.error("Error saving gig:", err);
      setFeedback({
        type: "error",
        msg: err instanceof Error ? err.message : "Failed to save gig. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="space-y-6 pb-8">
      <div className="mx-auto max-w-3xl">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 px-1 text-xs text-slate-500 mb-2">
          <Link href={backHref} className="hover:text-[#1453c4] font-semibold transition">
            ← Back to My Gigs
          </Link>
        </div>

        {/* Step indicator */}
        <div className="px-6 pt-2">
          <div className="flex items-center justify-between text-sm font-semibold text-slate-400">
            <StepItem number={1} label="Overview" active />
            <Connector />
            <StepItem number={2} label="Description" />
            <Connector />
            <StepItem number={3} label="Publish" />
          </div>
        </div>

        {/* Feedback Banner */}
        {feedback && (
          <div
            className={`mt-4 rounded-lg px-4 py-3 text-sm font-semibold border ${
              feedback.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            {feedback.msg}
          </div>
        )}

        <article className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <SectionTitle title={isEditMode ? "Edit Gig" : "Gig Overview"} />

          <div className="mt-5 space-y-4">
            {/* Gig Title */}
            <label className="block text-sm font-semibold text-slate-700">
              Gig Title *
              <input
                className={`mt-2 h-11 w-full rounded-lg border px-4 text-base outline-none transition focus:ring-2 ${
                  isTitleInvalid
                    ? "border-red-400 bg-red-50 text-slate-700 focus:border-red-500 focus:ring-red-100"
                    : "border-slate-200 text-slate-700 focus:border-[#1453c4] focus:ring-blue-100"
                }`}
                placeholder="e.g., I will capture birthday photography"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>
            <p className={`-mt-3 text-xs font-medium ${isTitleInvalid ? "text-red-500" : "text-slate-400"}`}>
              Create a catchy title starting with &apos;I will...&apos;
            </p>

            {/* Category */}
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                label="Service Category"
                value={selectedCategory}
                onChange={setCategory}
                options={serviceCategories}
                labelClassName="text-sm font-semibold text-slate-700"
                className="h-11 px-4 text-base text-slate-700"
              />

              <SelectField
                label="Delivery Time (Optional)"
                value={delivery}
                onChange={setDelivery}
                options={DELIVERY_OPTIONS}
                labelClassName="text-sm font-semibold text-slate-700"
                className="h-11 px-4 text-base text-slate-700"
              />
            </div>

            <label className="block text-sm font-semibold text-slate-700">
              Price (LKR) *
              <input
                type="number"
                min="1"
                step="1"
                className={`mt-2 h-11 w-full rounded-lg border px-4 text-base outline-none transition focus:ring-2 ${
                  isPriceInvalid
                    ? "border-red-400 bg-red-50 text-slate-700 focus:border-red-500 focus:ring-red-100"
                    : "border-slate-200 text-slate-700 focus:border-[#1453c4] focus:ring-blue-100"
                }`}
                placeholder="e.g., 5000"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </label>
            <p className={`-mt-3 text-xs font-medium ${isPriceInvalid ? "text-red-500" : "text-slate-400"}`}>
              Add the expected service price in Sri Lankan rupees.
            </p>

            {/* Tags */}
            <div>
              <label className="block text-sm font-semibold text-slate-700">
                Search Tags / Keywords (Optional, Max 5)
              </label>
              <div className="mt-2 flex min-h-11 items-center gap-2 flex-wrap rounded-lg border border-slate-200 bg-[#f6f7ff] px-3 py-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold text-teal-700"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-teal-500 hover:text-teal-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
                {tags.length < 5 && (
                  <input
                    type="text"
                    value={tagInput}
                    placeholder="Add a tag & press Enter..."
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    className="flex-1 min-w-[120px] bg-transparent text-sm text-slate-600 outline-none placeholder:text-slate-400"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Detailed Info */}
          <SectionTitle title="Detailed Information" className="mt-8" />
          <div className="mt-5 space-y-4">
            <label className="block text-sm font-semibold text-slate-700">
              Short Summary *
              <input
                className={`mt-2 h-11 w-full rounded-lg border px-4 text-base outline-none transition focus:ring-2 ${
                  isSummaryInvalid
                    ? "border-red-400 bg-red-50 text-slate-600 focus:border-red-500 focus:ring-red-100"
                    : "border-slate-200 text-slate-600 focus:border-[#1453c4] focus:ring-blue-100"
                }`}
                placeholder="A one-sentence pitch for your gig"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
              />
            </label>
            <p className={`-mt-2 text-xs font-medium ${isSummaryInvalid ? "text-red-500" : "text-slate-400"}`}>
              Add a short summary so buyers know what you offer.
            </p>

            <label className="block text-sm font-semibold text-slate-700">
              Detailed Description
              <textarea
                className="mt-2 h-36 w-full resize-none rounded-lg border border-slate-200 px-4 py-3 text-base text-slate-600 outline-none focus:border-[#1453c4] focus:ring-2 focus:ring-blue-100"
                placeholder="Describe what you are offering in detail. Mention your tools, process, and what the student will receive..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>
          </div>

          {/* Availability */}
          <SectionTitle title="Available Time" className="mt-8" />
          <div className="mt-5 space-y-3">
            <p className="text-sm text-slate-500">
              Select when students can expect you to be available for this gig. This is optional.
            </p>
            <div className="flex flex-wrap gap-3 rounded-2xl border border-transparent bg-transparent p-3">
              {availabilityOptions.map((slot) => {
                const isSelected = availability.includes(slot);
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => toggleAvailability(slot)}
                    className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                      isSelected
                        ? "border-[#1453c4] bg-[#e8efff] text-[#1453c4]"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
            <p className="text-xs font-medium text-slate-400">
              Leave this empty if you do not want to publish availability.
            </p>
          </div>

          {/* Gig Poster Section */}
          <SectionTitle title="Gig Poster / Thumbnail" className="mt-8" />
          <div className="mt-5 space-y-4">
            <p className="text-sm font-semibold text-slate-700">
              Choose a template or upload your custom poster:
            </p>
            
            {/* Presets */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: "Photography", src: "/img/package%201.jpg" },
                { label: "Design", src: "/img/package%202.jpg" },
                { label: "Crafts", src: "/img/package%203.jpg" },
                { label: "Events", src: "/img/package%204.jpg" },
              ].map((preset) => (
                <button
                  key={preset.src}
                  type="button"
                  onClick={() => {
                    setSelectedImage(preset.src);
                    setSelectedImageFile(null);
                  }}
                  className={`relative overflow-hidden rounded-xl border-4 transition ${
                    selectedImage === preset.src || decodeURIComponent(selectedImage).endsWith(preset.src.replace("/img/", ""))
                      ? "border-[#1453c4] scale-105"
                      : "border-transparent opacity-75 hover:opacity-100"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preset.src} alt={preset.label} className="h-24 w-full object-cover" />
                  <div className="absolute inset-x-0 bottom-0 bg-black/60 py-1 text-center text-[10px] font-bold text-white">
                    {preset.label}
                  </div>
                </button>
              ))}
            </div>

            {/* Custom upload */}
            <div className="rounded-xl border-2 border-dashed border-[#c8d0ee] bg-[#f5f6ff] px-6 py-6 text-center">
              <label className="cursor-pointer block">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-teal-300 text-lg text-teal-900">
                  ⤴
                </div>
                <p className="mt-2 text-lg font-semibold text-slate-800">Upload Custom Image</p>
                <p className="text-xs text-slate-500">Support JPG, PNG. Image will be converted for profile display.</p>
                <input
                  type="file"
                  accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (!SAMPLE_IMAGE_TYPES.has(file.type) || file.size > MAX_SAMPLE_IMAGE_BYTES) {
                        setFeedback({
                          type: "error",
                          msg: "Sample work image must be PNG, JPG, or WEBP and under 2 MB.",
                        });
                        return;
                      }

                      setSelectedImageFile(file);
                      setSelectedImage(URL.createObjectURL(file));
                    }
                  }}
                  className="hidden"
                />
              </label>
            </div>

            {/* Preview of current poster */}
            {selectedImage && (
              <div className="mt-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Current Selected Poster Preview:
                </p>
                <div className="mt-2 max-w-sm overflow-hidden rounded-xl border border-slate-200 shadow-sm relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={selectedImage} alt="Poster preview" className="h-44 w-full object-cover" />
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex items-center justify-between border-t border-slate-200 pt-5">
            <Link
              href={backHref}
              className="rounded-lg border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </Link>
            <button
              type="button"
              onClick={handlePublish}
              disabled={isSaving}
              className="rounded-lg bg-[#1453c4] px-7 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#0e3f9e] transition disabled:opacity-60"
            >
              {isSaving
                ? isEditMode
                  ? "Saving..."
                  : "Publishing..."
                : isEditMode
                  ? "Save Changes"
                  : "Publish Gig"}
            </button>
          </div>
        </article>
      </div>
    </section>
  );
}

function SectionTitle({ title, className = "" }: { title: string; className?: string }) {
  return (
    <div className={className}>
      <h2 className="text-xl font-semibold text-slate-800">{title}</h2>
      <div className="mt-2 h-px bg-slate-200" />
    </div>
  );
}

function StepItem({
  number,
  label,
  active = false,
}: {
  number: number;
  label: string;
  active?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-full text-lg font-semibold ${
          active ? "bg-[#1453c4] text-white" : "bg-slate-100 text-slate-400"
        }`}
      >
        {number}
      </div>
      <span className={`${active ? "text-[#1453c4]" : "text-slate-400"} text-sm`}>{label}</span>
    </div>
  );
}

function Connector() {
  return <div className="-mt-8 h-px flex-1 bg-slate-200" />;
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
