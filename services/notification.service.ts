import { prisma } from "@/lib/prisma";
import { isDatabaseOnline } from "@/lib/db-health";
import { NotificationType } from "@prisma/client";

export interface SystemNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
}

// In-memory persistent store for fast testing and offline environments
export const DEMO_NOTIFICATIONS_STORE: SystemNotification[] = [];

export class NotificationService {
  /**
   * Dispatch a notification to a specific user.
   */
  static async sendNotification({
    userId,
    title,
    message,
    type = NotificationType.SYSTEM,
    link,
  }: {
    userId: string;
    title: string;
    message: string;
    type?: NotificationType;
    link?: string;
  }): Promise<SystemNotification> {
    const memoryNotification: SystemNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId,
      title,
      message,
      type,
      link: link || null,
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    DEMO_NOTIFICATIONS_STORE.unshift(memoryNotification);

    try {
      if (await isDatabaseOnline()) {
        await prisma.notification.create({
          data: {
            userId,
            title,
            message,
            type,
            link: link || null,
          },
        });
      }
    } catch (err) {
      console.warn("Could not persist notification to database:", err);
    }

    return memoryNotification;
  }

  /**
   * Dispatch notifications in bulk to multiple users (e.g. all students in a division).
   */
  static async sendBulkNotification({
    userIds,
    title,
    message,
    type = NotificationType.ASSIGNMENT,
    link,
  }: {
    userIds: string[];
    title: string;
    message: string;
    type?: NotificationType;
    link?: string;
  }): Promise<void> {
    for (const userId of userIds) {
      await this.sendNotification({ userId, title, message, type, link });
    }
  }

  /**
   * Get unread notifications for a user.
   */
  static async getUserNotifications(userId: string): Promise<SystemNotification[]> {
    return DEMO_NOTIFICATIONS_STORE.filter((n) => n.userId === userId);
  }
}
