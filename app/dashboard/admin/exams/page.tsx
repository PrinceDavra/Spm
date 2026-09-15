import { AdminExamManagementView } from "@/components/exam/admin-exam-management-view";

export const metadata = {
  title: "Exam Management & Scheduling | CampusSphere",
  description: "Configure academic exams, detect scheduling conflicts, moderate gradebooks, and publish results.",
};

export default function AdminExamsPage() {
  return <AdminExamManagementView />;
}
