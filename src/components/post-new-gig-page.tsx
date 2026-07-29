"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { doc, serverTimestamp, updateDoc, writeBatch } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import ModalPortal from "@/components/ui/modal-portal";
import SelectField from "@/components/ui/select-field";
import { useAuth } from "@/context/AuthContext";
import type { ProviderGig } from "@/lib/auth";
import { db, storage } from "@/lib/firebase";
import { GIG_COVER_PRESETS, getGigCoverForCategory, isPresetGigCover } from "@/lib/gig-covers";
import { ensureGigTitlePrefix } from "@/lib/gig-titles";
import { useLookupOptions } from "@/lib/lookups";
import { AVAILABILITY_DAYS, AVAILABILITY_TIME_SLOTS } from "@/lib/platform";

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

  const skillIndex = isEditMode && gigId ? parseInt(gigId.replace("gig-", ""), 10) : -1;

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [delivery, setDelivery] = useState(DELIVERY_OPTIONS[0]);
  const [selectedImage, setSelectedImage] = useState<string>(
    getGigCoverForCategory("Photography", "Photography", 0),
  );
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [availability, setAvailability] = useState<string[]>([]);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [selectedPeriods, setSelectedPeriods] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [didAttemptSubmit, setDidAttemptSubmit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const backHref = role === "both" ? "/my-gigs/both?tab=manage" : "/my-gigs/provider?tab=manage";
  const selectedCategory = category.trim();
  const availabilityPeriods = useMemo(
    () =>
      Array.from(
        new Set([
          ...(timeSlotOptions.length ? timeSlotOptions : [...AVAILABILITY_TIME_SLOTS]),
          ...selectedPeriods,
          ...availability
            .map((slot) => {
              const normalizedSlot = slot.trim();
              const matchingDay = AVAILABILITY_DAYS.find((day) => normalizedSlot.startsWith(`${day} `));
              return matchingDay ? normalizedSlot.slice(matchingDay.length).trim() : "";
            })
            .filter(Boolean),
        ]),
      ),
    [availability, selectedPeriods, timeSlotOptions],
  );

  useEffect(() => {
    if (!isEditMode || !userProfile || skillIndex < 0) return;

    const gigs = userProfile.providerProfile?.gigs || [];
    const existingGig = gigs[skillIndex];
    const skills = userProfile.providerProfile?.skills || [];
    const legacySkill = skills[skillIndex];
    const resolvedTitle = existingGig?.title || legacySkill;

    if (!resolvedTitle) return;

    const timer = setTimeout(() => {
      setTitle(ensureGigTitlePrefix(resolvedTitle));
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
  }, [isEditMode, skillIndex, serviceCategories, userProfile]);

  useEffect(() => {
    if (!userProfile) return;

    const timer = setTimeout(() => {
      setAvailability((current) =>
        current.length ? current : (userProfile.providerProfile?.availability || []),
      );
    }, 0);

    return () => clearTimeout(timer);
  }, [userProfile]);

  useEffect(() => {
    if (selectedImageFile) return;
    if (!isPresetGigCover(selectedImage)) return;

    setSelectedImage(
      getGigCoverForCategory(selectedCategory || "Photography", title || selectedCategory, 0),
    );
  }, [selectedCategory, selectedImage, selectedImageFile, title]);

  useEffect(() => {
    if (!availability.length) return;

    const nextDays = new Set<string>();
    const nextPeriods = new Set<string>();

    availability.forEach((slot) => {
      const normalizedSlot = slot.trim();
      const matchingDay = AVAILABILITY_DAYS.find((day) => normalizedSlot.startsWith(`${day} `));
      if (!matchingDay) return;

      const period = normalizedSlot.slice(matchingDay.length).trim();
      nextDays.add(matchingDay);

      if (availabilityPeriods.includes(period)) {
        nextPeriods.add(period);
      }
    });

    const nextDaysList = Array.from(nextDays);
    const nextPeriodsList = Array.from(nextPeriods);

    setSelectedDays((current) =>
      areSameSelections(current, nextDaysList) ? current : nextDaysList,
    );
    setSelectedPeriods((current) =>
      areSameSelections(current, nextPeriodsList) ? current : nextPeriodsList,
    );
  }, [availability, availabilityPeriods]);

  const addTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed) && tags.length < 5) {
      setTags([...tags, trimmed]);
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => setTags(tags.filter((item) => item !== tag));

  const syncAvailability = (days: string[], periods: string[]) => {
    const combinations = days.flatMap((day) => periods.map((period) => `${day} ${period}`));
    setAvailability(combinations);
  };

  const toggleDay = (day: string) => {
    const nextDays = selectedDays.includes(day)
      ? selectedDays.filter((value) => value !== day)
      : [...selectedDays, day];

    setSelectedDays(nextDays);
    syncAvailability(nextDays, selectedPeriods);
  };

  const togglePeriod = (period: string) => {
    const nextPeriods = selectedPeriods.includes(period)
      ? selectedPeriods.filter((value) => value !== period)
      : [...selectedPeriods, period];

    setSelectedPeriods(nextPeriods);
    syncAvailability(selectedDays, nextPeriods);
  };

  const isTitleInvalid = didAttemptSubmit && !title.trim();
  const isCategoryInvalid = didAttemptSubmit && !selectedCategory;
  const isSummaryInvalid = didAttemptSubmit && !summary.trim();
  const isAvailabilityInvalid = didAttemptSubmit && availability.length === 0;
  const normalizedPrice = Number(price);
  const hasPriceInput = price.trim().length > 0;
  const resolvedPrice =
    hasPriceInput && Number.isFinite(normalizedPrice) && normalizedPrice > 0
      ? normalizedPrice
      : "";
  const isPriceInvalid =
    didAttemptSubmit &&
    hasPriceInput &&
    (!Number.isFinite(normalizedPrice) || normalizedPrice <= 0);

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

    if (
      !title.trim() ||
      !selectedCategory ||
      !summary.trim() ||
      availability.length === 0 ||
      (hasPriceInput && (!Number.isFinite(normalizedPrice) || normalizedPrice <= 0))
    ) {
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
      const existingSkills = [...(userProfile.providerProfile?.skills || [])];
      const existingImages = [...(userProfile.providerProfile?.gigImages || [])];
      const existingGigs: ProviderGig[] = [...(userProfile.providerProfile?.gigs || [])];
      const existingGigId = isEditMode && skillIndex >= 0 ? existingGigs[skillIndex]?.id : undefined;
      const gigDocumentId =
        existingGigId || `${userProfile.uid}-${Date.now()}-${slugify(title.trim() || "gig")}`;
      const imageUrl = await resolveSampleImage(gigDocumentId);

      const gigLabel = ensureGigTitlePrefix(title);
      const gigData: ProviderGig = {
        id: gigDocumentId,
        title: gigLabel,
        category: selectedCategory,
        summary: summary.trim(),
        description: description.trim(),
        price: resolvedPrice,
        delivery,
        availability,
        tags,
        image: imageUrl,
        sampleWorkUrl: imageUrl,
        status: "active",
      };

      while (existingImages.length < existingSkills.length) {
        existingImages.push(getGigCoverForCategory(selectedCategory, gigLabel, existingImages.length));
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
        existingSkills[skillIndex] = gigLabel;
        existingImages[skillIndex] = imageUrl;
        existingGigs[skillIndex] = gigData;
      } else {
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
          providerImage: userProfile.profileImageUrl || "",
          university: userProfile.university || "",
          degreeName: userProfile.degree || "",
          yearOfStudy: userProfile.yearOfStudy || "",
          categoryId: slugify(selectedCategory),
          category: selectedCategory,
          title: gigLabel,
          description: description.trim() || summary.trim(),
          summary: summary.trim(),
          price: resolvedPrice,
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
        msg: isEditMode ? "Gig updated successfully! Redirecting..." : "Gig published successfully! Redirecting...",
      });

      setTimeout(() => {
        router.push(backHref);
      }, 1500);
    } catch (error) {
      console.error("Error saving gig:", error);
      setFeedback({
        type: "error",
        msg: error instanceof Error ? error.message : "Failed to save gig. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteGig = async () => {
    if (!userProfile || skillIndex < 0) return;

    setShowDeleteConfirm(false);
    setIsDeleting(true);
    setFeedback(null);

    try {
      const userRef = doc(db, "users", userProfile.uid);
      const existingSkills = [...(userProfile.providerProfile?.skills || [])];
      const existingImages = [...(userProfile.providerProfile?.gigImages || [])];
      const existingGigs: ProviderGig[] = [...(userProfile.providerProfile?.gigs || [])];
      const removedGigId = existingGigs[skillIndex]?.id;
      const updatedSkills = existingSkills.filter((_, index) => index !== skillIndex);
      const updatedImages = existingImages.filter((_, index) => index !== skillIndex);
      const updatedGigs = existingGigs.filter((_, index) => index !== skillIndex);

      await updateDoc(userRef, {
        "providerProfile.skills": updatedSkills,
        "providerProfile.gigImages": updatedImages,
        "providerProfile.gigs": updatedGigs,
      });

      if (removedGigId) {
        await updateDoc(doc(db, "gigs", removedGigId), {
          status: "removed",
          gigStatus: "removed",
          updatedAt: serverTimestamp(),
        });
      }

      await refreshProfile();
      router.push(backHref);
    } catch (error) {
      console.error("Error deleting gig:", error);
      setFeedback({
        type: "error",
        msg: "Failed to delete the gig. Please try again.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <section className="space-y-6 pb-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-2 flex items-center gap-2 px-1 text-xs text-slate-500">
          <Link href={backHref} className="font-semibold transition hover:text-[#1453c4]">
            ← Back to My Gigs
          </Link>
        </div>

        <div className="px-6 pt-2">
          <div className="flex items-center justify-between text-sm font-semibold text-slate-400">
            <StepItem number={1} label="Overview" active />
            <Connector />
            <StepItem number={2} label="Description" />
            <Connector />
            <StepItem number={3} label="Publish" />
          </div>
        </div>

        {feedback && (
          <div
            className={`mt-4 rounded-lg border px-4 py-3 text-sm font-semibold ${
              feedback.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            {feedback.msg}
          </div>
        )}

        <article className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <SectionTitle title={isEditMode ? "Edit Gig" : "Gig Overview"} />

          <div className="mt-5 space-y-6">
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
                onChange={(event) => setTitle(event.target.value)}
              />
            </label>
            <p className={`-mt-3 text-xs font-medium ${isTitleInvalid ? "text-red-500" : "text-slate-400"}`}>
              Create a catchy title starting with &apos;I will...&apos;
            </p>

            <div className="grid gap-4 md:grid-cols-2 md:items-start">
              <div className="space-y-2">
                <SelectField
                  label="Service Category *"
                  value={selectedCategory}
                  onChange={setCategory}
                  options={serviceCategories}
                  placeholder="Select a service category"
                  labelClassName="text-sm font-semibold text-slate-700"
                  className={`h-11 px-4 text-base text-slate-700 ${isCategoryInvalid ? "border-red-400 bg-red-50" : ""}`}
                />
                <p className={`text-xs font-medium ${isCategoryInvalid ? "text-red-500" : "text-slate-400"}`}>
                  Choose the main category that best matches this gig.
                </p>
              </div>

              <div className="space-y-2">
                <SelectField
                  label="Delivery Time (Optional)"
                  value={delivery}
                  onChange={setDelivery}
                  options={DELIVERY_OPTIONS}
                  labelClassName="text-sm font-semibold text-slate-700"
                  className="h-11 px-4 text-base text-slate-700"
                />
                <p className="text-xs font-medium text-slate-400">
                  Let buyers know your expected turnaround time.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700">
                Search Tags / Keywords (Optional, Max 5)
              </label>
              <div className="mt-2 flex min-h-11 flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-[#f6f7ff] px-3 py-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold text-teal-700"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="cursor-pointer text-teal-500 hover:text-teal-800"
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
                    onChange={(event) => setTagInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        addTag();
                      }
                    }}
                    className="min-w-[120px] flex-1 bg-transparent text-sm text-slate-600 outline-none placeholder:text-slate-400"
                  />
                )}
              </div>
            </div>

            <div className="max-w-xl space-y-2">
              <label className="block text-sm font-semibold text-slate-700">
                Price (LKR) (Optional)
                <input
                  type="number"
                  min="0"
                  step="1"
                  className={`mt-2 h-11 w-full rounded-lg border px-4 text-base outline-none transition focus:ring-2 ${
                    isPriceInvalid
                      ? "border-red-400 bg-red-50 text-slate-700 focus:border-red-500 focus:ring-red-100"
                      : "border-slate-200 text-slate-700 focus:border-[#1453c4] focus:ring-blue-100"
                  }`}
                  placeholder="e.g., 5000"
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
                />
              </label>
              <p className={`text-xs font-medium ${isPriceInvalid ? "text-red-500" : "text-slate-400"}`}>
                Leave this empty if you prefer to discuss the price in chat.
              </p>
            </div>
          </div>

          <SectionTitle title="Available Time" className="mt-8" />
          <div className="mt-5 rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                Select your available days and time periods for this gig.
              </p>
              <span className="text-xs font-semibold text-slate-400">
                {availability.length} slot{availability.length === 1 ? "" : "s"} selected
              </span>
            </div>

            <div
              className={`mt-4 rounded-2xl border p-4 ${
                isAvailabilityInvalid ? "border-red-300 bg-red-50/60" : "border-slate-200 bg-slate-50/60"
              }`}
            >
              <div className="space-y-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                    Weekly Availability *
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
                    {AVAILABILITY_DAYS.map((day) => {
                      const active = selectedDays.includes(day);
                      return (
                        <label
                          key={day}
                          className={`flex min-h-[78px] cursor-pointer flex-col items-center justify-center rounded-2xl border px-3 py-3 text-center transition ${
                            active
                              ? "border-[#1453c4] bg-[#e8efff] text-[#1453c4] shadow-sm"
                              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={active}
                            onChange={() => toggleDay(day)}
                            className="sr-only"
                          />
                          <span
                            className={`flex h-5 w-5 items-center justify-center rounded-md border text-[11px] ${
                              active
                                ? "border-[#1453c4] bg-[#1453c4] text-white"
                                : "border-slate-300 bg-white text-transparent"
                            }`}
                          >
                            ✓
                          </span>
                          <span className="mt-2 text-xs font-bold uppercase tracking-wide">
                            {day.slice(0, 3)}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                    Time Periods *
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
                    {availabilityPeriods.map((period) => {
                      const active = selectedPeriods.includes(period);
                      return (
                        <label
                          key={period}
                          className={`flex min-h-[78px] cursor-pointer flex-col items-center justify-center rounded-2xl border px-3 py-3 text-center transition ${
                            active
                              ? "border-[#1453c4] bg-[#e8efff] text-[#1453c4] shadow-sm"
                              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={active}
                            onChange={() => togglePeriod(period)}
                            className="sr-only"
                          />
                          <span
                            className={`flex h-5 w-5 items-center justify-center rounded-md border text-[11px] ${
                              active
                                ? "border-[#1453c4] bg-[#1453c4] text-white"
                                : "border-slate-300 bg-white text-transparent"
                            }`}
                          >
                            ✓
                          </span>
                          <span className="mt-2 text-sm font-semibold">{period}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <p className={`text-xs font-medium ${isAvailabilityInvalid ? "text-red-500" : "text-slate-400"}`}>
              Pick at least one day and one time period to publish this gig.
            </p>
          </div>

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
                onChange={(event) => setSummary(event.target.value)}
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
                onChange={(event) => setDescription(event.target.value)}
              />
            </label>
          </div>

          <SectionTitle title="Gig Poster / Thumbnail" className="mt-8" />
          <div className="mt-5 space-y-4">
            <p className="text-sm font-semibold text-slate-700">
              Choose a template or upload your custom poster:
            </p>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {GIG_COVER_PRESETS.map((preset) => (
                <button
                  key={preset.src}
                  type="button"
                  onClick={() => {
                    setSelectedImage(preset.src);
                    setSelectedImageFile(null);
                  }}
                  className={`relative cursor-pointer overflow-hidden rounded-xl border-4 transition ${
                    selectedImage === preset.src || decodeURIComponent(selectedImage).endsWith(preset.src.replace("/img/", ""))
                      ? "scale-105 border-[#1453c4]"
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

            <div className="rounded-xl border-2 border-dashed border-[#c8d0ee] bg-[#f5f6ff] px-6 py-6 text-center">
              <label className="block cursor-pointer">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-teal-300 text-lg text-teal-900">
                  ⤴
                </div>
                <p className="mt-2 text-lg font-semibold text-slate-800">Upload Custom Image</p>
                <p className="text-xs text-slate-500">
                  Support JPG, PNG. Image will be converted for profile display.
                </p>
                <input
                  type="file"
                  accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;

                    if (!SAMPLE_IMAGE_TYPES.has(file.type) || file.size > MAX_SAMPLE_IMAGE_BYTES) {
                      setFeedback({
                        type: "error",
                        msg: "Sample work image must be PNG, JPG, or WEBP and under 2 MB.",
                      });
                      return;
                    }

                    setSelectedImageFile(file);
                    setSelectedImage(URL.createObjectURL(file));
                  }}
                  className="hidden"
                />
              </label>
            </div>

            {selectedImage && (
              <div className="mt-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Current Selected Poster Preview:
                </p>
                <div className="relative mt-2 max-w-sm overflow-hidden rounded-xl border border-slate-200 shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={selectedImage} alt="Poster preview" className="h-44 w-full object-cover" />
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={backHref}
                className="rounded-lg border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </Link>
              {isEditMode ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isSaving || isDeleting}
                  className="rounded-lg border border-red-200 bg-red-50 px-5 py-2 text-sm font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-100 disabled:opacity-60"
                >
                  Delete Gig
                </button>
              ) : null}
            </div>
            <button
              type="button"
              onClick={handlePublish}
              disabled={isSaving || isDeleting}
              className="rounded-lg bg-[#1453c4] px-7 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0e3f9e] disabled:opacity-60"
            >
              {isSaving ? (isEditMode ? "Saving..." : "Publishing...") : isEditMode ? "Save Changes" : "Publish Gig"}
            </button>
          </div>
        </article>
      </div>

      {showDeleteConfirm ? (
        <ModalPortal>
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/40 px-4 py-6 backdrop-blur-md">
            <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_24px_70px_-30px_rgba(15,23,42,0.55)]">
              <div className="flex items-start gap-3">
                <span className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500">
                  <DeleteIcon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-red-500">Delete Gig</p>
                  <h2 className="text-base font-semibold text-slate-900">
                    Delete this gig from your profile?
                  </h2>
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                This will remove <span className="font-semibold text-slate-700">{title.trim() || "this gig"}</span> from your public gigs list.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteGig}
                  disabled={isDeleting}
                  className="rounded-xl bg-red-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-60"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      ) : null}
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
      <span className={`text-sm ${active ? "text-[#1453c4]" : "text-slate-400"}`}>{label}</span>
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

function areSameSelections(current: string[], next: string[]) {
  return (
    current.length === next.length &&
    current.every((value, index) => value === next[index])
  );
}

function DeleteIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 6h18" />
      <path d="M8 6V4.75A1.75 1.75 0 0 1 9.75 3h4.5A1.75 1.75 0 0 1 16 4.75V6" />
      <path d="M6.75 6l.7 11.16A2 2 0 0 0 9.45 19h5.1a2 2 0 0 0 2-1.84L17.25 6" />
      <path d="M10 10.25v5.5" />
      <path d="M14 10.25v5.5" />
    </svg>
  );
}
