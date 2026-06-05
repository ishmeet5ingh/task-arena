import { getFirebaseAdminMessaging } from "@/lib/firebase/admin";
import { mergeNotificationSettings, type NotificationSettingKey, type NotificationSettings } from "@/lib/notificationSettings";

type NotificationInput = {
  tokens: string[];
  title: string;
  body: string;
  link?: string;
};

type NotificationUser = {
  notificationTokens?: Array<{ token?: string }>;
  notificationSettings?: Partial<NotificationSettings>;
};

export async function sendPushNotification({ tokens, title, body, link = "/dashboard/game" }: NotificationInput) {
  const cleanTokens = Array.from(new Set(tokens.filter(Boolean)));
  if (!cleanTokens.length) return { successCount: 0, failureCount: 0 };

  const messaging = getFirebaseAdminMessaging();
  const response = await messaging.sendEachForMulticast({
    tokens: cleanTokens,
    notification: {
      title,
      body
    },
    webpush: {
      fcmOptions: {
        link
      },
      notification: {
        icon: "/icon.svg",
        badge: "/icon.svg",
        tag: "task-arena"
      }
    }
  });

  return {
    successCount: response.successCount,
    failureCount: response.failureCount
  };
}

export function notificationTokensForUser(user: NotificationUser | null | undefined) {
  return (user?.notificationTokens ?? []).map((item) => item.token).filter((token): token is string => Boolean(token));
}

export async function sendUserNotification(
  user: NotificationUser | null | undefined,
  notification: Omit<NotificationInput, "tokens">
) {
  const tokens = notificationTokensForUser(user);
  if (!tokens.length) return { successCount: 0, failureCount: 0 };
  return sendPushNotification({ ...notification, tokens });
}

export async function trySendUserNotification(
  user: NotificationUser | null | undefined,
  notification: Omit<NotificationInput, "tokens">
) {
  try {
    return await sendUserNotification(user, notification);
  } catch (error) {
    console.warn("Could not send push notification", error);
    return { successCount: 0, failureCount: 0 };
  }
}

export function notificationSettingEnabled(user: NotificationUser | null | undefined, key: NotificationSettingKey) {
  return mergeNotificationSettings(user?.notificationSettings)[key];
}

export async function trySendUserNotificationForSetting(
  user: NotificationUser | null | undefined,
  key: NotificationSettingKey,
  notification: Omit<NotificationInput, "tokens">
) {
  if (!notificationSettingEnabled(user, key)) return { successCount: 0, failureCount: 0 };
  return trySendUserNotification(user, notification);
}
