import { requireRole } from "@/lib/auth/rbac";
import { Role } from "@prisma/client";
import { StudentDriveDetail } from "@/components/placement/student-drive-detail";

export const metadata = {
  title: "Drive Details & Eligibility | CampusSphere",
  description: "View transparent academic eligibility requirements, job profile description, and submit candidacy.",
};

export default async function StudentDriveDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole([Role.STUDENT]);
  const { id } = await params;
  return <StudentDriveDetail driveId={id} />;
}
