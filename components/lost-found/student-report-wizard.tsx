"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Upload,
  Check,
  AlertCircle,
  Sparkles,
  MapPin,
  Calendar,
  Clock,
  ShieldCheck,
  Tag,
  FileText,
} from "lucide-react";
import { LostFoundType, LostFoundCategory, LostFoundStatus } from "@prisma/client";

export function StudentReportWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialType = searchParams.get("type") === "FOUND" ? LostFoundType.FOUND : LostFoundType.LOST;

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [uploading, setUploading] = useState(false);

  // Form State
  const [type, setType] = useState<LostFoundType>(initialType);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<LostFoundCategory>(LostFoundCategory.ELECTRONICS);
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [dateLostFound, setDateLostFound] = useState(new Date().toISOString().split("T")[0]);
  const [timeLostFound, setTimeLostFound] = useState("");
  const [identifyingDetails, setIdentifyingDetails] = useState("");
  const [contactPreference, setContactPreference] = useState("CAMPUS_PORTAL");
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const categories = Object.keys(LostFoundCategory) as LostFoundCategory[];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setErrorMsg("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/lost-found/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to upload photo");
      }

      setImageUrl(data.attachment.fileUrl);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Upload error");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (statusToSet: LostFoundStatus) => {
    setSubmitting(true);
    setErrorMsg("");

    try {
      const payload = {
        type,
        title,
        category,
        description,
        location,
        dateLostFound,
        timeLostFound: timeLostFound || null,
        contactPreference,
        identifyingDetails: identifyingDetails || null,
        imageUrl: imageUrl || null,
        status: statusToSet,
      };

      const res = await fetch("/api/lost-found", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit report");
      }

      router.push(`/dashboard/student/lost-found/${data.item.id}`);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Submission failed");
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/dashboard/student/lost-found"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Lost & Found Hub
        </Link>
      </div>

      {/* Progress Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">
              {type === LostFoundType.LOST ? "Report a Lost Possession" : "Report a Found Item"}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Step {step} of 4:{" "}
              {step === 1
                ? "Item Type & Basic Details"
                : step === 2
                ? "Location & Date"
                : step === 3
                ? "Identification & Photo"
                : "Review & Publish"}
            </p>
          </div>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-2.5 w-8 rounded-full transition-colors ${
                  s === step
                    ? "bg-blue-600"
                    : s < step
                    ? "bg-emerald-500"
                    : "bg-slate-200 dark:bg-slate-800"
                }`}
              />
            ))}
          </div>
        </div>

        {errorMsg && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {errorMsg}
          </div>
        )}
      </div>

      {/* Wizard Form Steps */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {/* Step 1: Type & Basics */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                1. What are you reporting?
              </label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setType(LostFoundType.LOST)}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition ${
                    type === LostFoundType.LOST
                      ? "border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 font-bold"
                      : "border-slate-200 dark:border-slate-800 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <span className="text-lg mb-1">🔍</span>
                  <span className="text-sm font-black">I Lost Something</span>
                  <span className="text-[11px] font-normal text-slate-500">I am searching for my missing item</span>
                </button>
                <button
                  type="button"
                  onClick={() => setType(LostFoundType.FOUND)}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition ${
                    type === LostFoundType.FOUND
                      ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 font-bold"
                      : "border-slate-200 dark:border-slate-800 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <span className="text-lg mb-1">🎁</span>
                  <span className="text-sm font-black">I Found Something</span>
                  <span className="text-[11px] font-normal text-slate-500">I secured an unattended item on campus</span>
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Item Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g., Apple 96W USB-C Charger with Magsafe Cable"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm outline-none transition focus:border-blue-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as LostFoundCategory)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm outline-none transition focus:border-blue-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Contact Preference
                </label>
                <select
                  value={contactPreference}
                  onChange={(e) => setContactPreference(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm outline-none transition focus:border-blue-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950"
                >
                  <option value="CAMPUS_PORTAL">CampusSphere Portal Messages (Recommended)</option>
                  <option value="SECURITY_DESK">Deliver to Main Gate Security Desk</option>
                  <option value="DEPT_OFFICE">Department Coordinator Office</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Detailed Public Description <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={4}
                placeholder="Describe the item's general appearance, condition, context of where it was seen..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm outline-none transition focus:border-blue-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Tip: Keep secret unique marks or private contents for the next step so genuine owners can verify themselves.
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Location & Timing */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Campus Location <span className="text-rose-500">*</span>
              </label>
              <div className="relative mt-1">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g., Central Library 2nd Floor, Desk 14 near Study Wing"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Date {type === LostFoundType.LOST ? "Lost" : "Found"} <span className="text-rose-500">*</span>
                </label>
                <div className="relative mt-1">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="date"
                    value={dateLostFound}
                    onChange={(e) => setDateLostFound(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Approximate Time (Optional)
                </label>
                <div className="relative mt-1">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="e.g., 04:30 PM, after lab exam"
                    value={timeLostFound}
                    onChange={(e) => setTimeLostFound(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Identifiers & Photo */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Secret / Distinguishing Identifying Marks (For Claim Verification)
              </label>
              <textarea
                rows={3}
                placeholder="e.g., Green marker dot near the prongs; laser engraving; exact cash in wallet; family photo in slot..."
                value={identifyingDetails}
                onChange={(e) => setIdentifyingDetails(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm outline-none transition focus:border-blue-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Security note: This information helps campus administrators confirm genuine claims.
              </p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Optional Item Photo Attachment
              </label>
              <div className="mt-2 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center dark:border-slate-800 dark:bg-slate-950">
                {imageUrl ? (
                  <div className="relative group">
                    <img
                      src={imageUrl}
                      alt="Uploaded preview"
                      className="h-44 w-auto rounded-xl object-cover shadow"
                    />
                    <button
                      type="button"
                      onClick={() => setImageUrl(null)}
                      className="mt-2 text-xs font-semibold text-rose-600 hover:text-rose-700"
                    >
                      Remove Photo
                    </button>
                  </div>
                ) : (
                  <div>
                    <Upload className="mx-auto h-8 w-8 text-slate-400" />
                    <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                      Drag and drop an image, or click to upload
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Supports JPG, PNG, WEBP (Max 5MB)
                    </p>
                    <label className="mt-3 inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-white border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                      <span>{uploading ? "Uploading..." : "Select Image"}</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleFileUpload}
                        disabled={uploading}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Review & Publish */}
        {step === 4 && (
          <div className="space-y-5">
            <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 dark:border-blue-900/50 dark:bg-blue-950/30">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-800 dark:text-blue-300">
                <ShieldCheck className="h-4 w-4" />
                Community Board Publication Review
              </div>
              <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                Your report will be publicly visible to all verified university students and campus faculty. The automated matching engine will scan for matching items immediately.
              </p>
            </div>

            <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Report Type</span>
                <span
                  className={`text-xs font-black uppercase rounded px-2 py-0.5 ${
                    type === LostFoundType.LOST
                      ? "bg-rose-100 text-rose-700"
                      : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {type}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Item Title</span>
                <span className="text-xs font-bold text-slate-900 dark:text-white">{title}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Category</span>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {category.replace(/_/g, " ")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Campus Location</span>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{location}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Date</span>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {dateLostFound} {timeLostFound ? `• ${timeLostFound}` : ""}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Wizard Controls */}
        <div className="mt-8 flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              disabled={submitting}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Previous
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-3">
            {step === 4 ? (
              <>
                <button
                  type="button"
                  onClick={() => handleSubmit(LostFoundStatus.DRAFT)}
                  disabled={submitting}
                  className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  Save as Draft
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmit(LostFoundStatus.PUBLISHED)}
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-blue-700 disabled:opacity-50"
                >
                  <Check className="h-4 w-4" />
                  {submitting ? "Publishing..." : "Publish Report"}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (step === 1 && (!title.trim() || !description.trim())) {
                    setErrorMsg("Please provide both title and description");
                    return;
                  }
                  if (step === 2 && !location.trim()) {
                    setErrorMsg("Please specify campus location");
                    return;
                  }
                  setErrorMsg("");
                  setStep(step + 1);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-blue-700"
              >
                Next Step
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
