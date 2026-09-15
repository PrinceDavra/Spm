import { FacultyGradebookView } from "@/components/exam/faculty-gradebook-view";

export const metadata = {
  title: "Faculty Exam Gradebook | CampusSphere",
  description: "Record exam marks, absent status, and process revaluation requests for assigned courses.",
};

export default function FacultyExamsPage() {
  return <FacultyGradebookView />;
}
