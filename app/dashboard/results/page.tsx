import { StudentResultsView } from "@/components/exam/student-results-view";

export const metadata = {
  title: "Examination Results & GPA | CampusSphere",
  description: "View verified semester grades, course evaluation outcomes, and cumulative grade point averages.",
};

export default function StudentResultsPage() {
  return <StudentResultsView />;
}
