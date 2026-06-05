"use client";

import { getApp, getApps, initializeApp } from "firebase/app";
import { getMessaging, getToken, isSupported, onMessage, type Messaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

function hasFirebaseConfig() {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.authDomain &&
      firebaseConfig.projectId &&
      firebaseConfig.messagingSenderId &&
      firebaseConfig.appId &&
      process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
  );
}

async function canOpenIndexedDB() {
  if (!("indexedDB" in window)) return false;

  return new Promise<boolean>((resolve) => {
    const request = indexedDB.open("task-arena-notification-support-check", 1);
    request.onerror = () => resolve(false);
    request.onsuccess = () => {
      request.result.close();
      indexedDB.deleteDatabase("task-arena-notification-support-check");
      resolve(true);
    };
  });
}

export async function getFirebaseMessagingStatus() {
  if (typeof window === "undefined") {
    return { supported: false, reason: "Notifications must be enabled from the browser." };
  }

  if (!window.isSecureContext) {
    return { supported: false, reason: "Open the app with HTTPS before enabling notifications." };
  }

  if (!("Notification" in window)) {
    return { supported: false, reason: "This browser does not expose notification permission." };
  }

  if (!("indexedDB" in window) || !(await canOpenIndexedDB())) {
    return { supported: false, reason: "Chrome site data is blocked. Allow cookies/site data for this app." };
  }

  if (!navigator.cookieEnabled) {
    return { supported: false, reason: "Chrome cookies are blocked. Allow cookies/site data for this app." };
  }

  if (!("serviceWorker" in navigator)) {
    return { supported: false, reason: "This browser does not support service workers." };
  }

  if (!("PushManager" in window)) {
    return { supported: false, reason: "Chrome Push notifications are unavailable in this installed app." };
  }

  if (!("fetch" in window)) {
    return { supported: false, reason: "This browser does not support fetch, which Firebase needs." };
  }

  if (!("ServiceWorkerRegistration" in window) || !("showNotification" in ServiceWorkerRegistration.prototype)) {
    return { supported: false, reason: "Chrome service worker notifications are unavailable." };
  }

  if (!("PushSubscription" in window) || !("getKey" in PushSubscription.prototype)) {
    return { supported: false, reason: "Chrome push subscription keys are unavailable." };
  }

  if (!hasFirebaseConfig()) {
    return { supported: false, reason: "Firebase web notification env values are missing." };
  }

  if (!(await isSupported())) {
    return { supported: false, reason: "Firebase web notifications are not supported in this browser." };
  }

  return { supported: true, reason: "Ready to enable task reminders on this device." };
}

export function getFirebaseApp() {
  if (!hasFirebaseConfig()) return null;
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

export async function getFirebaseMessaging() {
  const status = await getFirebaseMessagingStatus();
  if (!status.supported) return null;

  const app = getFirebaseApp();
  return app ? getMessaging(app) : null;
}

export async function getNotificationToken() {
  const messaging = await getFirebaseMessaging();
  if (!messaging) return null;

  const registration =
    (await navigator.serviceWorker.getRegistration("/")) ?? (await navigator.serviceWorker.register("/sw.js"));

  return getToken(messaging, {
    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    serviceWorkerRegistration: registration
  });
}

export function listenForForegroundMessages(messaging: Messaging, onReceive: (payload: unknown) => void) {
  return onMessage(messaging, onReceive);
}
