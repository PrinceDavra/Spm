import { Role } from "@prisma/client";
import { requireRole } from "@/lib/auth/rbac";
import { AdminTimetableManager } from "@/components/timetable/admin-timetable-manager";
import { DEMO_ROOMS, DEMO_TIMETABLES_STORE } from "@/lib/timetable/demo-timetable";

export const metadata = {
  title: "Timetable Generator (CSP) | CampusSphere Admin",
  description: "Deterministic Constraint Satisfaction Problem solver for academic course schedules.",
};

export default async function AdminTimetablePage() {
  await requireRole([Role.ADMIN]);

  const initialTimetable = DEMO_TIMETABLES_STORE.find(
    (t) => t.divisionId === "div-comp-a"
  ) || null;

  return (
    <div className="space-y-6">
      <AdminTimetableManager
        initialTimetable={initialTimetable}
        rooms={DEMO_ROOMS}
        divisionId="div-comp-a"
      />
    </div>
  );
}
