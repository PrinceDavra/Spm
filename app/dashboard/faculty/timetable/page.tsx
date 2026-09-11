import { Role } from "@prisma/client";
import { requireRole } from "@/lib/auth/rbac";
import { TimetableService } from "@/services/timetable.service";
import { FacultyTimetableView } from "@/components/timetable/faculty-timetable-view";

export const metadata = {
  title: "Faculty Teaching Schedule | CampusSphere",
  description: "View consolidated weekly teaching schedule across assigned academic divisions and rooms.",
};

export default async function FacultyTimetablePage() {
  const sessionUser = await requireRole([Role.FACULTY, Role.ADMIN]);

  const data = await TimetableService.getFacultyTimetable(sessionUser.id);
  const facultyName = `Prof. ${sessionUser.firstName} ${sessionUser.lastName}`;

  return (
    <div className="space-y-6">
      <FacultyTimetableView
        facultyName={facultyName}
        totalWeeklyPeriods={data.totalWeeklyTeachingPeriods}
        todayDay={data.todayDay}
        todaySlots={data.todaySlots}
        allSlots={data.allSlots}
      />
    </div>
  );
}
