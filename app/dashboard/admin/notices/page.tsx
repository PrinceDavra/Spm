import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { NoticeService } from "@/services/notice.service";
import { AdminNoticeManager, AdminNoticeItem, AdminAnalyticsData } from "@/components/notices/admin-notice-manager";
import { Role } from "@prisma/client";

export const metadata = {
  title: "Notice Center & Broadcast Management | CampusSphere",
  description: "Institutional circulars, administrative alerts, and reach metrics.",
};

export default async function AdminNoticesPage() {
  const user = await getSession();
  if (!user) {
    redirect("/login?from=/dashboard/admin/notices");
  }

  if (user.role !== Role.ADMIN) {
    redirect("/dashboard/student/notices");
  }

  const { notices } = await NoticeService.getNotices({
    userId: user.id,
    role: Role.ADMIN,
    includeArchived: true,
    limit: 100,
  });

  const analytics = await NoticeService.getNoticeAnalytics(user.id, Role.ADMIN);

  const formatted: AdminNoticeItem[] = notices.map((n) => ({
    id: n.id,
    title: n.title,
    summary: n.summary || "",
    content: n.content,
    category: n.category,
    priority: n.priority,
    audience: n.audience,
    status: n.status,
    publishDate: n.publishDate,
    expiryDate: n.expiryDate,
    authorId: n.authorId,
    authorName: n.authorName,
    departmentName: n.departmentName,
    divisionName: n.divisionName,
    semester: n.semester,
    reachStats: n.reachStats,
    attachments: n.attachments,
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <AdminNoticeManager
        initialNotices={formatted}
        initialAnalytics={analytics as unknown as AdminAnalyticsData}
      />
    </div>
  );
}
