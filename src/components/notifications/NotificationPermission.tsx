"use client";

import { BellRing, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import {
  getFirebaseMessaging,
  getFirebaseMessagingStatus,
  getNotificationToken,
  listenForForegroundMessages
} from "@/lib/firebase/client";
import {
  mergeNotificationSettings,
  notificationSettingLabels,
  type NotificationSettingKey,
  type NotificationSettings
} from "@/lib/notificationSettings";
import { cn } from "@/lib/utils";

type BrowserNotificationPermission = "default" | "denied" | "granted";

export function NotificationPermission({
  initialEnabled = false,
  initialSettings
}: {
  initialEnabled?: boolean;
  initialSettings?: Partial<NotificationSettings>;
}) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [settings, setSettings] = useState<NotificationSettings>(() => mergeNotificationSettings(initialSettings));
  const [supported, setSupported] = useState<boolean | null>(null);
  const [supportMessage, setSupportMessage] = useState("Checking notification support...");
  const [permission, setPermission] = useState<BrowserNotificationPermission>("default");
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [savingKey, setSavingKey] = useState<NotificationSettingKey | null>(null);

  useEffect(() => {
    setEnabled(initialEnabled);
    setSettings(mergeNotificationSettings(initialSettings));
  }, [initialEnabled, initialSettings]);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    async function boot() {
      if (typeof window === "undefined" || !("Notification" in window)) {
        setSupported(false);
        setSupportMessage("This browser does not expose notification permission.");
        return;
      }

      setPermission(Notification.permission);
      if (Notification.permission === "denied") {
        setSupported(true);
        setSupportMessage("Notifications are blocked in Chrome settings for this app.");
        return;
      }

      const status = await getFirebaseMessagingStatus();
      setSupported(status.supported);
      setSupportMessage(status.reason);
      if (!status.supported) return;

      const messaging = await getFirebaseMessaging().catch(() => null);
      if (!messaging) {
        setSupported(false);
        setSupportMessage("Firebase messaging could not start on this device.");
        return;
      }

      unsubscribe = listenForForegroundMessages(messaging, (payload) => {
        const notification = (payload as { notification?: { title?: string; body?: string } }).notification;
        toast.info(notification?.title ?? "Task Arena notification", {
          description: notification?.body
        });
      });
    }

    boot();
    return () => unsubscribe?.();
  }, []);

  async function enableNotifications({ silent = false }: { silent?: boolean } = {}) {
    setLoading(true);
    try {
      if (supported !== true) {
        if (!silent) toast.error(supportMessage);
        return false;
      }

      const nextPermission = await Notification.requestPermission();
      setPermission(nextPermission);
      if (nextPermission !== "granted") {
        const deniedMessage =
          nextPermission === "denied"
            ? "Notifications are blocked in Chrome settings for this app."
            : "Notification permission was not granted";
        setSupportMessage(deniedMessage);
        if (!silent) toast.error(deniedMessage);
        return false;
      }

      const token = await getNotificationToken();
      if (!token) {
        if (!silent) toast.error("Could not create a notification token");
        return false;
      }

      const res = await fetch("/api/notifications/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token })
      });
      const data = await res.json();
      if (!res.ok) {
        if (!silent) toast.error(data.error ?? "Could not enable notifications");
        return false;
      }

      setEnabled(true);
      if (!silent) toast.success("Notifications enabled");
      return true;
    } catch {
      if (!silent) toast.error("Could not enable notifications");
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function sendTest() {
    setTesting(true);
    try {
      const ready = await enableNotifications({ silent: true });
      if (!ready) {
        toast.error("Enable notifications on this device first");
        return;
      }

      const res = await fetch("/api/notifications/test", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Could not send test notification");
        return;
      }
      toast.success("Test notification sent");
    } catch {
      toast.error("Could not send test notification");
    } finally {
      setTesting(false);
    }
  }

  async function toggleSetting(key: NotificationSettingKey) {
    const nextSettings = {
      ...settings,
      [key]: !settings[key]
    };
    setSettings(nextSettings);
    setSavingKey(key);

    try {
      const res = await fetch("/api/notifications/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: { [key]: nextSettings[key] } })
      });
      const data = await res.json();
      if (!res.ok) {
        setSettings(settings);
        toast.error(data.error ?? "Could not update notification setting");
        return;
      }
      setSettings(mergeNotificationSettings(data.settings));
    } catch {
      setSettings(settings);
      toast.error("Could not update notification setting");
    } finally {
      setSavingKey(null);
    }
  }

  return (
    <div className="grid gap-3 rounded-md border border-slate-700/60 bg-slate-950/50 p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Notifications</p>
          <p className="mt-1 text-sm text-slate-300">
            {supported === false
              ? supportMessage
              : permission === "denied"
                ? "Notifications are blocked in Chrome settings for this app."
              : enabled || permission === "granted"
                ? "Enabled on this device"
                : supportMessage}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant={enabled || permission === "granted" ? "success" : "primary"} onClick={() => enableNotifications()} disabled={loading || supported !== true}>
            <BellRing size={17} /> {loading ? "Enabling..." : enabled || permission === "granted" ? "Refresh token" : "Enable"}
          </Button>
          <Button variant="ghost" onClick={sendTest} disabled={testing || !(enabled || permission === "granted")}>
            <Send size={17} /> {testing ? "Sending..." : "Test"}
          </Button>
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {notificationSettingLabels.map((item) => {
          const checked = settings[item.key];
          const saving = savingKey === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => toggleSetting(item.key)}
              disabled={Boolean(savingKey)}
              className={cn(
                "flex min-h-14 items-center justify-between gap-3 rounded-md border p-2.5 text-left transition disabled:cursor-not-allowed disabled:opacity-60",
                checked ? "border-cyan-300/45 bg-cyan-300/10" : "border-slate-700/60 bg-slate-950/45"
              )}
            >
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-slate-100">{item.label}</span>
                <span className="block text-xs text-slate-500">{item.description}</span>
              </span>
              <span
                className={cn(
                  "relative h-6 w-11 shrink-0 rounded-full border transition",
                  checked ? "border-cyan-300/50 bg-cyan-300/30" : "border-slate-600 bg-slate-900"
                )}
                aria-hidden="true"
              >
                <span
                  className={cn(
                    "absolute top-1 h-4 w-4 rounded-full bg-slate-100 transition",
                    checked ? "left-6 bg-cyan-100" : "left-1"
                  )}
                />
              </span>
              <span className="sr-only">{saving ? "Saving" : checked ? "On" : "Off"}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
