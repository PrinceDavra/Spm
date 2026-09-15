import { requireRole } from "@/lib/auth/rbac";
import { Role } from "@prisma/client";
import { notFound } from "next/navigation";
import { LostFoundService } from "@/services/lost-found.service";
import { StudentItemDetail } from "@/components/lost-found/student-item-detail";

export const metadata = {
  title: "Item Details & Claim Verification | CampusSphere",
  description: "View item information, deterministic matches, and submit verified recovery claims.",
};

export default async function StudentItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole([Role.STUDENT, Role.FACULTY, Role.ADMIN]);
  const { id } = await params;

  const result = await LostFoundService.getItemById(id, user.id, user.role);
  if (!result) {
    notFound();
  }

  return (
    <StudentItemDetail
      item={result.item}
      claimsCount={result.claimsCount}
      potentialMatches={result.potentialMatches}
      currentUserId={user.id}
    />
  );
}
