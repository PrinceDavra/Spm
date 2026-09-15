import { requireRole } from "@/lib/auth/rbac";
import { Role } from "@prisma/client";
import { notFound } from "next/navigation";
import { LostFoundService } from "@/services/lost-found.service";
import { StudentItemDetail } from "@/components/lost-found/student-item-detail";

export const metadata = {
  title: "Admin Item Audit & Verification | CampusSphere",
  description: "Administrative inspection of item report, potential matches, and associated claims.",
};

export default async function AdminItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole([Role.ADMIN]);
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
