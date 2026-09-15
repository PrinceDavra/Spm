import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { NotificationCenterView } from "@/components/notifications/notification-center-view";

export default async function NotificationCenterPage() {
  const user = await getSession();
  if (!user) {
    redirect("/login");
  }

  return <NotificationCenterView userRole={user.role} userId={user.id} />;
}
