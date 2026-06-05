const SW_VERSION = "task-arena-v1";

try {
  importScripts("https://www.gstatic.com/firebasejs/12.14.0/firebase-app-compat.js");
  importScripts("https://www.gstatic.com/firebasejs/12.14.0/firebase-messaging-compat.js");

  firebase.initializeApp({
    apiKey: "AIzaSyAdoTzPjvkV9_cQVYhQJSkmJn7LwK5__0w",
    authDomain: "task-arena-52350.firebaseapp.com",
    projectId: "task-arena-52350",
    storageBucket: "task-arena-52350.firebasestorage.app",
    messagingSenderId: "229489729667",
    appId: "1:229489729667:web:af0b01d9607ad481d3fbb6",
    measurementId: "G-KLQDS1KVL8"
  });

  const messaging = firebase.messaging();
  messaging.onBackgroundMessage((payload) => {
    const title = payload.notification?.title ?? "Task Arena";
    const options = {
      body: payload.notification?.body ?? "You have a new Task Arena update.",
      icon: "/icon.svg",
      badge: "/icon.svg",
      tag: payload.data?.tag ?? "task-arena",
      data: {
        link: payload.fcmOptions?.link ?? payload.data?.link ?? "/dashboard/game"
      }
    };

    self.registration.showNotification(title, options);
  });
} catch (error) {
  console.warn("Firebase messaging could not initialize in service worker.", error);
}

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== SW_VERSION).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/_next/")) {
    event.respondWith(fetch(request));
    return;
  }

  event.respondWith(
    fetch(request, { cache: "no-store" }).catch(() => caches.match(request))
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const link = event.notification.data?.link ?? "/dashboard/game";
  const targetUrl = new URL(link, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client && client.url.startsWith(self.location.origin)) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      return clients.openWindow(targetUrl);
    })
  );
});
