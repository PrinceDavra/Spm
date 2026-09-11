import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { NoticeService } from "@/services/notice.service";
import { ProfileService } from "@/services/profile.service";
import { StudentNoticeDetail, NoticeDetailData } from "@/components/notices/student-notice-detail";
import { Role } from "@prisma/client";

export default async function StudentNoticeDetailPage(
  props: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) {
    redirect("/login");
  }

  const { id } = await props.params;

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
    console.warn("Could not load student profile for notice detail:", err);
  }

  let notice;
  try {
    notice = await NoticeService.getNoticeById(id, {
      userId: user.id,
      role: Role.STUDENT,
      departmentId,
      divisionId,
      semester,
    });
  } catch (err: any) {
    if (err.message && err.message.includes("Unauthorized")) {
      return (
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl p-8">
            <h2 className="text-lg font-bold text-rose-800 dark:text-rose-200">Access Restricted</h2>
            <p className="text-sm text-rose-600 dark:text-rose-400 mt-2">
              This notice is addressed to a specific department or class that does not match your student enrollment.
            </p>
          </div>
        </div>
      );
    }
    return notFound();
  }

  const detailData: NoticeDetailData = {
    id: notice.id,
    title: notice.title,
    summary: notice.summary || "",
    content: notice.content,
    category: notice.category,
    priority: notice.priority,
    audience: notice.audience,
    publishDate: notice.publishDate,
    expiryDate: notice.expiryDate,
    authorName: notice.authorName,
    authorRole: notice.authorRole,
    departmentName: notice.departmentName,
    divisionName: notice.divisionName,
    semester: notice.semester,
    isRead: notice.isRead,
    attachments: notice.attachments,
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <StudentNoticeDetail notice={detailData} />
    </div>
  );
}
