import { requireRole } from "@/lib/auth/rbac";
import { Role } from "@prisma/client";
import { StudentTimedQuiz } from "@/components/placement/student-timed-quiz";

export const metadata = {
  title: "Live Timed Assessment | CampusSphere",
  description: "Timed recruitment screener with countdown auto-submit, question navigation, and server-side scoring.",
};

export default async function StudentTimedQuizPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole([Role.STUDENT]);
  const { id } = await params;
  return <StudentTimedQuiz quizId={id} />;
}
