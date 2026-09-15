"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  PlusCircle,
  MapPin,
  Calendar,
  Clock,
  Tag,
  ShieldCheck,
  AlertCircle,
  Laptop,
  Wallet,
  FileText,
  Book,
  Briefcase,
  Shirt,
  Key,
  Sparkles,
  Watch,
  FolderOpen,
  HelpCircle,
  Coffee,
  CheckCircle2,
  Eye,
} from "lucide-react";
import { LostFoundType, LostFoundCategory, LostFoundStatus } from "@prisma/client";

interface Item {
  id: string;
  referenceNumber: string;
  type: LostFoundType;
  title: string;
  description: string;
  category: LostFoundCategory;
  status: LostFoundStatus;
  location: string;
  dateLostFound: string;
  timeLostFound?: string | null;
  imageUrl?: string | null;
  createdAt: string;
}

const CATEGORY_ICONS: Record<string, typeof Laptop> = {
  ELECTRONICS: Laptop,
  WALLET: Wallet,
  ID_DOCUMENT: FileText,
  STUDENT_CARD: FileText,
  BOOK: Book,
  BAG: Briefcase,
  CLOTHING: Shirt,
  KEYS: Key,
  JEWELLERY: Sparkles,
  ACCESSORY: Watch,
  STATIONERY: FolderOpen,
  SPORTS: ShieldCheck,
  WATER_BOTTLE: Coffee,
  OTHER: HelpCircle,
};

export function StudentLostFoundHub() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedLocation, setSelectedLocation] = useState<string>("ALL");

  useEffect(() => {
    fetchItems();
  }, [selectedType, selectedCategory, selectedLocation, search]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedType !== "ALL") params.set("type", selectedType);
      if (selectedCategory !== "ALL") params.set("category", selectedCategory);
      if (selectedLocation !== "ALL") params.set("location", selectedLocation);
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/lost-found?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setItems(data.items || []);
      }
    } catch {
      // Graceful fallback
    } finally {
      setLoading(false);
    }
  };

  const categories = Object.keys(CATEGORY_ICONS);
  const locations = [
    "Central Library",
    "Computer Lab",
    "Student Canteen",
    "Main Auditorium",
    "Sports Complex",
    "Classroom Block B",
    "Hostel 4",
    "Main Gate",
  ];

  return (
    <div className="space-y-6">
      {/* Hero Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 p-8 text-white shadow-xl">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
            Campus Belongings Recovery Portal
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Lost & Found Community Hub
          </h1>
          <p className="text-sm text-blue-100 sm:text-base leading-relaxed">
            Report lost possessions, claim items secured across campus, or submit found belongings to campus administration with automated potential matching.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/dashboard/student/lost-found/report?type=LOST"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-blue-700 shadow-md transition-transform hover:-translate-y-0.5 hover:bg-blue-50"
            >
              <PlusCircle className="h-4 w-4" />
              Report Lost Item
            </Link>
            <Link
              href="/dashboard/student/lost-found/report?type=FOUND"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-700/60 border border-white/20 px-4 py-2.5 text-sm font-bold text-white backdrop-blur-sm transition-transform hover:-translate-y-0.5 hover:bg-blue-700/80"
            >
              <PlusCircle className="h-4 w-4" />
              Report Found Item
            </Link>
            <Link
              href="/dashboard/student/lost-found/my-reports"
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/20"
            >
              My Reports
            </Link>
            <Link
              href="/dashboard/student/lost-found/claims"
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/20"
            >
              My Claims
            </Link>
          </div>
        </div>
        <div className="absolute -right-10 -bottom-10 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
      </div>

      {/* Filter and Controls Toolbar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by keyword, item title, case ref, or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:focus:border-blue-400"
            />
          </div>

          {/* Type Toggle Tabs */}
          <div className="flex items-center rounded-xl bg-slate-100 p-1 dark:bg-slate-800 self-start sm:self-auto">
            {["ALL", "LOST", "FOUND"].map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`rounded-lg px-4 py-1.5 text-xs font-bold transition ${
                  selectedType === type
                    ? "bg-white text-blue-600 shadow-sm dark:bg-slate-900 dark:text-blue-400"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                {type === "ALL" ? "All Items" : type === "LOST" ? "Lost Items" : "Found Items"}
              </button>
            ))}
          </div>
        </div>

        {/* Category & Location Facets */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
            <Filter className="h-3 w-3" /> Category:
          </span>
          <button
            onClick={() => setSelectedCategory("ALL")}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
              selectedCategory === "ALL"
                ? "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            All Categories
          </button>
          {categories.slice(0, 8).map((cat) => {
            const Icon = CATEGORY_ICONS[cat] || HelpCircle;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                  selectedCategory === cat
                    ? "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                <Icon className="h-3 w-3" />
                {cat.replace(/_/g, " ")}
              </button>
            );
          })}

          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Location:</span>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs outline-none dark:border-slate-800 dark:bg-slate-950"
            >
              <option value="ALL">Any Campus Location</option>
              {locations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Items Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-800/50"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
            <Search className="h-7 w-7" />
          </div>
          <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
            No matching reports found
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-md">
            Try adjusting your search query, clearing filters, or post a new report if you have lost or found something.
          </p>
          <div className="mt-5 flex gap-3">
            <button
              onClick={() => {
                setSearch("");
                setSelectedType("ALL");
                setSelectedCategory("ALL");
                setSelectedLocation("ALL");
              }}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              Reset Filters
            </button>
            <Link
              href="/dashboard/student/lost-found/report"
              className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-blue-700"
            >
              Create New Report
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const Icon = CATEGORY_ICONS[item.category] || HelpCircle;
            const isLost = item.type === LostFoundType.LOST;
            const isResolved = item.status === LostFoundStatus.RESOLVED;

            return (
              <div
                key={item.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
              >
                <div>
                  {/* Photo or Illustrative Banner */}
                  <div className="relative h-44 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 text-slate-400">
                        <Icon className="h-16 w-16 stroke-1 text-slate-300 dark:text-slate-700" />
                      </div>
                    )}

                    {/* Type Badge */}
                    <div className="absolute left-3 top-3 flex items-center gap-1.5">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-black uppercase tracking-wide shadow-sm ${
                          isLost
                            ? "bg-rose-500 text-white"
                            : "bg-emerald-500 text-white"
                        }`}
                      >
                        {item.type}
                      </span>
                      {isResolved && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/80 backdrop-blur-sm px-2 py-0.5 text-xs font-semibold text-white">
                          <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                          Resolved
                        </span>
                      )}
                    </div>

                    {/* Case Reference Number */}
                    <div className="absolute right-3 top-3">
                      <span className="rounded-md bg-black/60 px-2 py-0.5 text-[11px] font-mono font-medium text-white backdrop-blur-sm">
                        {item.referenceNumber}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 dark:bg-slate-800">
                        <Icon className="h-3 w-3 text-blue-500" />
                        {item.category.replace(/_/g, " ")}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 line-clamp-1 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {item.title}
                    </h3>

                    <p className="text-xs text-slate-600 line-clamp-2 dark:text-slate-300 leading-relaxed">
                      {item.description}
                    </p>

                    <div className="space-y-1 pt-1 text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="line-clamp-1">{item.location}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>{new Date(item.dateLostFound).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                        {item.timeLostFound && (
                          <span className="flex items-center gap-1 text-slate-400">
                            • <Clock className="h-3 w-3" /> {item.timeLostFound}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="border-t border-slate-100 p-4 pt-3 dark:border-slate-800 flex items-center justify-between">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      item.status === LostFoundStatus.CLAIM_PENDING
                        ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                        : item.status === LostFoundStatus.RESOLVED
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                        : "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                    }`}
                  >
                    {item.status.replace(/_/g, " ")}
                  </span>

                  <Link
                    href={`/dashboard/student/lost-found/${item.id}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    View & Claim
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
