import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { NoticeService } from "@/services/notice.service";
import { ProfileService } from "@/services/profile.service";
import { StudentNoticeCenter, NoticeCardData } from "@/components/notices/student-notice-center";
import { Role } from "@prisma/client";

export const metadata = {
  title: "Notice Center | CampusSphere",
  description: "Official notices, circulars, and institutional announcements.",
};

export default async function StudentNoticesPage() {
  const user = await getSession();
  if (!user) {
    redirect("/login?from=/dashboard/student/notices");
  }

  // Resolve student academic profile
  let departmentId = "dept-comp";
  let divisionId = "div-comp-a";
  let semester = 6;

  try {
    const profile = await ProfileService.getProfile(user.id);
    if (profile?.student) {
      semester = profile.student.semester || 6;
      departmentId = "dept-comp";
      divisionId = "div-comp-a";
    }
  } catch (err) {
    console.warn("Could not load student profile for notice board:", err);
  }

  const { notices } = await NoticeService.getNotices({
    userId: user.id,
    role: Role.STUDENT,
    departmentId,
    divisionId,
    semester,
  });

  const unreadCount = await NoticeService.getUnreadCount(
    user.id,
    Role.STUDENT,
    departmentId,
    divisionId,
    semester
  );

  const formattedNotices: NoticeCardData[] = notices.map((n) => ({
    id: n.id,
    title: n.title,
    summary: n.summary || n.content.substring(0, 160) + "...",
    category: n.category,
    priority: n.priority,
    publishDate: n.publishDate,
    expiryDate: n.expiryDate,
    authorName: n.authorName,
    departmentName: n.departmentName,
    isRead: n.isRead,
    attachments: n.attachments,
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <StudentNoticeCenter initialNotices={formattedNotices} unreadCount={unreadCount} />
    </div>
  );
}
