import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { NoticeService } from "@/services/notice.service";
import { FacultyNoticeCenter, FacultyNoticeItem } from "@/components/notices/faculty-notice-center";
import { Role } from "@prisma/client";

export const metadata = {
  title: "Faculty Notice Center | CampusSphere",
  description: "Academic notices, departmental guidelines, and institutional circulars.",
};

export default async function FacultyNoticesPage() {
  const user = await getSession();
  if (!user) {
    redirect("/login?from=/dashboard/faculty/notices");
  }

  if (user.role !== Role.FACULTY && user.role !== Role.ADMIN) {
    redirect("/dashboard/student/notices");
  }

  const { notices } = await NoticeService.getNotices({
    userId: user.id,
    role: user.role,
    departmentId: "dept-comp",
    includeArchived: true,
  });

  const formatted: FacultyNoticeItem[] = notices.map((n) => ({
    id: n.id,
    title: n.title,
    summary: n.summary || "",
    content: n.content,
    category: n.category,
    priority: n.priority,
    audience: n.audience,
    status: n.status,
    publishDate: n.publishDate,
    authorId: n.authorId,
    authorName: n.authorName,
    departmentName: n.departmentName,
    divisionName: n.divisionName,
    semester: n.semester,
    isRead: n.isRead,
    reachStats: n.reachStats,
    attachments: n.attachments,
  }));

  const fullName = `${user.firstName || "Faculty"} ${user.lastName || "Member"}`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <FacultyNoticeCenter
        initialNotices={formatted}
        facultyId={user.id}
        facultyName={fullName}
      />
    </div>
  );
}
