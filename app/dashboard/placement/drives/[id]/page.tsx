import { Role } from "@prisma/client";
import { requireRole } from "@/lib/auth/rbac";
import { OfficerDriveDetail } from "@/components/placement/officer-drive-detail";

export const metadata = {
  title: "Drive Candidates & Operations | CampusSphere",
  description: "Screen candidates, advance applicant stages, and record recruiter evaluation remarks.",
};

export default async function OfficerDriveDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole([Role.PLACEMENT_OFFICER, Role.ADMIN]);
  const { id } = await params;
  return <OfficerDriveDetail driveId={id} />;
}
