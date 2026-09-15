"use client";

import { useState } from "react";
import {
  Building,
  FlaskConical,
  Plus,
  Search,
  CheckCircle2,
  Edit2,
  Power,
  Users,
  Video,
  X,
  AlertCircle,
  Cpu,
} from "lucide-react";
import { RoomType } from "@prisma/client";

interface RoomItem {
  id: string;
  roomNumber: string;
  building: string;
  floor: number;
  capacity: number;
  type: RoomType;
  hasProjector: boolean;
  isAvailable: boolean;
  departmentId?: string | null;
  departmentName?: string;
  isActive: boolean;
}

interface LaboratoryItem {
  id: string;
  name: string;
  code: string;
  departmentId: string;
  departmentName?: string;
  roomId?: string | null;
  roomNumber?: string;
  capacity: number;
  equipment: string[];
  labAssistant?: string | null;
  isActive: boolean;
}

interface DepartmentSummary {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
}

export function RoomManager({
  initialRooms,
  initialLaboratories,
  departments,
}: {
  initialRooms: RoomItem[];
  initialLaboratories: LaboratoryItem[];
  departments: DepartmentSummary[];
}) {
  const [activeTab, setActiveTab] = useState<"ROOMS" | "LABS">("ROOMS");
  const [rooms, setRooms] = useState<RoomItem[]>(initialRooms);
  const [laboratories, setLaboratories] = useState<LaboratoryItem[]>(initialLaboratories);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string>("ALL");

  // Room Modal State
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<RoomItem | null>(null);
  const [roomForm, setRoomForm] = useState<{
    roomNumber: string;
    building: string;
    floor: number;
    capacity: number;
    type: RoomType;
    hasProjector: boolean;
    isAvailable: boolean;
    departmentId: string;
    isActive: boolean;
  }>({
    roomNumber: "",
    building: "Academic Block A",
    floor: 2,
    capacity: 70,
    type: RoomType.CLASSROOM,
    hasProjector: true,
    isAvailable: true,
    departmentId: "",
    isActive: true,
  });

  // Lab Modal State
  const [isLabModalOpen, setIsLabModalOpen] = useState(false);
  const [editingLab, setEditingLab] = useState<LaboratoryItem | null>(null);
  const [labForm, setLabForm] = useState({
    name: "",
    code: "",
    departmentId: departments[0]?.id || "",
    roomId: "",
    capacity: 35,
    equipmentInput: "",
    labAssistant: "",
    isActive: true,
  });

  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const openCreateRoomModal = () => {
    setEditingRoom(null);
    setRoomForm({
      roomNumber: "",
      building: "Academic Block A",
      floor: 2,
      capacity: 70,
      type: RoomType.CLASSROOM,
      hasProjector: true,
      isAvailable: true,
      departmentId: "",
      isActive: true,
    });
    setFormError("");
    setIsRoomModalOpen(true);
  };

  const openEditRoomModal = (r: RoomItem) => {
    setEditingRoom(r);
    setRoomForm({
      roomNumber: r.roomNumber,
      building: r.building,
      floor: r.floor,
      capacity: r.capacity,
      type: r.type,
      hasProjector: r.hasProjector,
      isAvailable: r.isAvailable,
      departmentId: r.departmentId || "",
      isActive: r.isActive,
    });
    setFormError("");
    setIsRoomModalOpen(true);
  };

  const openCreateLabModal = () => {
    setEditingLab(null);
    setLabForm({
      name: "",
      code: "",
      departmentId: departments.find((d) => d.isActive)?.id || "",
      roomId: rooms.find((r) => r.type === RoomType.LAB && r.isActive)?.id || "",
      capacity: 35,
      equipmentInput: "Workstations, High-Speed Ethernet Switch",
      labAssistant: "",
      isActive: true,
    });
    setFormError("");
    setIsLabModalOpen(true);
  };

  const openEditLabModal = (l: LaboratoryItem) => {
    setEditingLab(l);
    setLabForm({
      name: l.name,
      code: l.code,
      departmentId: l.departmentId,
      roomId: l.roomId || "",
      capacity: l.capacity,
      equipmentInput: l.equipment.join(", "),
      labAssistant: l.labAssistant || "",
      isActive: l.isActive,
    });
    setFormError("");
    setIsLabModalOpen(true);
  };

  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setIsSubmitting(true);

    if (roomForm.capacity <= 0) {
      setFormError("Room capacity must be strictly greater than 0");
      setIsSubmitting(false);
      return;
    }

    const payload = {
      ...roomForm,
      departmentId: roomForm.departmentId ? roomForm.departmentId : null,
    };

    try {
      if (editingRoom) {
        const res = await fetch(`/api/admin/academic/rooms/${editingRoom.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update room");

        const dept = departments.find((d) => d.id === data.room.departmentId);
        const enriched = { ...data.room, departmentName: dept?.name };
        setRooms((prev) => prev.map((r) => (r.id === editingRoom.id ? enriched : r)));
        showToast(`Room '${data.room.roomNumber}' updated.`);
      } else {
        const res = await fetch("/api/admin/academic/rooms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create room");

        const dept = departments.find((d) => d.id === data.room.departmentId);
        const enriched = { ...data.room, departmentName: dept?.name };
        setRooms((prev) => [enriched, ...prev]);
        showToast(`Room '${data.room.roomNumber}' created.`);
      }
      setIsRoomModalOpen(false);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to save room");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveLab = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setIsSubmitting(true);

    if (labForm.capacity <= 0) {
      setFormError("Laboratory capacity must be strictly greater than 0");
      setIsSubmitting(false);
      return;
    }

    const equipment = labForm.equipmentInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      name: labForm.name,
      code: labForm.code,
      departmentId: labForm.departmentId,
      roomId: labForm.roomId ? labForm.roomId : null,
      capacity: labForm.capacity,
      equipment,
      labAssistant: labForm.labAssistant.trim() ? labForm.labAssistant.trim() : null,
      isActive: labForm.isActive,
    };

    try {
      if (editingLab) {
        const res = await fetch(`/api/admin/academic/laboratories/${editingLab.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update laboratory");

        const dept = departments.find((d) => d.id === data.laboratory.departmentId);
        const rm = rooms.find((r) => r.id === data.laboratory.roomId);
        const enriched = {
          ...data.laboratory,
          departmentName: dept?.name,
          roomNumber: rm?.roomNumber,
        };
        setLaboratories((prev) => prev.map((l) => (l.id === editingLab.id ? enriched : l)));
        showToast(`Laboratory '${data.laboratory.name}' updated.`);
      } else {
        const res = await fetch("/api/admin/academic/laboratories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create laboratory");

        const dept = departments.find((d) => d.id === data.laboratory.departmentId);
        const rm = rooms.find((r) => r.id === data.laboratory.roomId);
        const enriched = {
          ...data.laboratory,
          departmentName: dept?.name,
          roomNumber: rm?.roomNumber,
        };
        setLaboratories((prev) => [enriched, ...prev]);
        showToast(`Laboratory '${data.laboratory.name}' created.`);
      }
      setIsLabModalOpen(false);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to save laboratory");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredRooms = rooms.filter((r) => {
    const matchSearch =
      r.roomNumber.toLowerCase().includes(search.toLowerCase()) ||
      r.building.toLowerCase().includes(search.toLowerCase());
    const matchType = selectedType === "ALL" || r.type === selectedType;
    return matchSearch && matchType;
  });

  const filteredLabs = laboratories.filter((l) => {
    const matchSearch =
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.code.toLowerCase().includes(search.toLowerCase()) ||
      (l.roomNumber && l.roomNumber.toLowerCase().includes(search.toLowerCase()));
    return matchSearch;
  });

  return (
    <div className="space-y-6">
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 rounded-xl bg-slate-900 text-white px-4 py-3 shadow-xl border border-slate-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header and Switcher */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="inline-flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800 self-start">
          <button
            onClick={() => setActiveTab("ROOMS")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === "ROOMS"
                ? "bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-400"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            Classrooms & Halls ({rooms.length})
          </button>
          <button
            onClick={() => setActiveTab("LABS")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === "LABS"
                ? "bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-400"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            Specialized Laboratories ({laboratories.length})
          </button>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder={activeTab === "ROOMS" ? "Search rooms..." : "Search labs..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
            />
          </div>

          {activeTab === "ROOMS" && (
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="text-xs py-2 px-3 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-medium"
            >
              <option value="ALL">All Types</option>
              <option value="CLASSROOM">Classroom</option>
              <option value="LAB">Lab Room</option>
              <option value="AUDITORIUM">Auditorium</option>
              <option value="SEMINAR_HALL">Seminar Hall</option>
            </select>
          )}

          {activeTab === "ROOMS" ? (
            <button
              onClick={openCreateRoomModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition whitespace-nowrap"
            >
              <Plus className="h-4 w-4" />
              <span>Add Room</span>
            </button>
          ) : (
            <button
              onClick={openCreateLabModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-sm transition whitespace-nowrap"
            >
              <Plus className="h-4 w-4" />
              <span>Add Lab</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab 1: Rooms Grid */}
      {activeTab === "ROOMS" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRooms.map((r) => (
            <div
              key={r.id}
              className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-5 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center dark:bg-indigo-950/60 dark:text-indigo-400 font-bold text-xs">
                      <Building className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                        {r.roomNumber}
                      </h3>
                      <span className="text-[11px] text-slate-500 font-medium">
                        {r.building} &bull; Floor {r.floor}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                      r.type === RoomType.LAB
                        ? "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
                        : r.type === RoomType.AUDITORIUM
                        ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                        : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                    }`}
                  >
                    {r.type}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                    <Users className="h-3.5 w-3.5 text-slate-400" />
                    <span>Capacity: <strong className="text-slate-900 dark:text-white">{r.capacity}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                    <Video className="h-3.5 w-3.5 text-slate-400" />
                    <span>AV: {r.hasProjector ? "Projector Equipped" : "No Projector"}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <button
                  onClick={() => openEditRoomModal(r)}
                  className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  <span>Edit</span>
                </button>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    r.isAvailable && r.isActive
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-slate-100 text-slate-600 border border-slate-200"
                  }`}
                >
                  {r.isActive && r.isAvailable ? "AVAILABLE" : "UNAVAILABLE"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Laboratories Grid */}
      {activeTab === "LABS" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLabs.map((l) => (
            <div
              key={l.id}
              className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-5 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center dark:bg-purple-950/60 dark:text-purple-400 font-bold text-xs">
                      <FlaskConical className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                        {l.name}
                      </h3>
                      <span className="font-mono text-[11px] font-bold text-purple-600 dark:text-purple-400">
                        {l.code}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      l.isActive
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {l.isActive ? "ACTIVE" : "INACTIVE"}
                  </span>
                </div>

                <div className="mt-2 text-xs text-slate-500 space-y-1">
                  <div>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Room:</span>{" "}
                    {l.roomNumber || <span className="text-amber-600 font-semibold">Unassigned (Health Warning)</span>}
                  </div>
                  {l.labAssistant && (
                    <div>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Lab Assistant:</span>{" "}
                      {l.labAssistant}
                    </div>
                  )}
                </div>

                {l.equipment.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Equipment & Instruments
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {l.equipment.map((eq, i) => (
                        <span
                          key={i}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
                        >
                          {eq}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <button
                  onClick={() => openEditLabModal(l)}
                  className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  <span>Edit</span>
                </button>
                <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                  <Users className="h-3.5 w-3.5" />
                  <span>Capacity: <strong className="text-slate-800 dark:text-slate-200">{l.capacity}</strong></span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Room Modal */}
      {isRoomModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {editingRoom ? "Edit Physical Room" : "Create Physical Room"}
              </h3>
              <button onClick={() => setIsRoomModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRoom} className="p-5 space-y-4">
              {formError && (
                <div className="rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 p-3 text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Room Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Room 205"
                    value={roomForm.roomNumber}
                    onChange={(e) => setRoomForm({ ...roomForm, roomNumber: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Room Type *
                  </label>
                  <select
                    value={roomForm.type}
                    onChange={(e) => setRoomForm({ ...roomForm, type: e.target.value as RoomType })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value={RoomType.CLASSROOM}>Classroom</option>
                    <option value={RoomType.LAB}>Laboratory</option>
                    <option value={RoomType.AUDITORIUM}>Auditorium</option>
                    <option value={RoomType.SEMINAR_HALL}>Seminar Hall</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Building *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Academic Block A"
                    value={roomForm.building}
                    onChange={(e) => setRoomForm({ ...roomForm, building: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Floor Number
                  </label>
                  <input
                    type="number"
                    value={roomForm.floor}
                    onChange={(e) => setRoomForm({ ...roomForm, floor: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Seating Capacity *
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={roomForm.capacity}
                  onChange={(e) => setRoomForm({ ...roomForm, capacity: parseInt(e.target.value, 10) || 1 })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-4 pt-1 text-xs">
                <label className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={roomForm.hasProjector}
                    onChange={(e) => setRoomForm({ ...roomForm, hasProjector: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Has Projector / AV</span>
                </label>
                <label className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={roomForm.isAvailable}
                    onChange={(e) => setRoomForm({ ...roomForm, isAvailable: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Available for Timetable</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRoomModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : editingRoom ? "Save Changes" : "Create Room"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Laboratory Modal */}
      {isLabModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {editingLab ? "Edit Laboratory" : "Create Laboratory"}
              </h3>
              <button onClick={() => setIsLabModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveLab} className="p-5 space-y-4">
              {formError && (
                <div className="rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 p-3 text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Laboratory Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Artificial Intelligence & Robotics Lab"
                  value={labForm.name}
                  onChange={(e) => setLabForm({ ...labForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Lab Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="LAB-CS-04"
                    value={labForm.code}
                    onChange={(e) => setLabForm({ ...labForm, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Department *
                  </label>
                  <select
                    value={labForm.departmentId}
                    onChange={(e) => setLabForm({ ...labForm, departmentId: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {departments
                      .filter((d) => d.isActive)
                      .map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.code})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Linked Physical Room
                  </label>
                  <select
                    value={labForm.roomId}
                    onChange={(e) => setLabForm({ ...labForm, roomId: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">-- Unassigned Physical Room --</option>
                    {rooms
                      .filter((r) => r.type === RoomType.LAB && r.isActive)
                      .map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.roomNumber} ({r.building})
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Capacity
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={labForm.capacity}
                    onChange={(e) => setLabForm({ ...labForm, capacity: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Equipment / Hardware List (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="30x Workstations, FPGA Kits, Oscilloscope"
                  value={labForm.equipmentInput}
                  onChange={(e) => setLabForm({ ...labForm, equipmentInput: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Lab Assistant In-Charge
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Pawar"
                  value={labForm.labAssistant}
                  onChange={(e) => setLabForm({ ...labForm, labAssistant: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsLabModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : editingLab ? "Save Changes" : "Create Laboratory"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
