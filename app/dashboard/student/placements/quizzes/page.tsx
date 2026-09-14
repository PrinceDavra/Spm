import { requireRole } from "@/lib/auth/rbac";
import { Role } from "@prisma/client";
import { StudentQuizzesList } from "@/components/placement/student-quizzes-list";

export const metadata = {
  title: "Timed Placement Quizzes | CampusSphere",
  description: "Take timed aptitude and technical placement tests with countdown timers and instant server grading.",
};

export default async function StudentQuizzesPage() {
  await requireRole([Role.STUDENT]);
  return <StudentQuizzesList />;
}
