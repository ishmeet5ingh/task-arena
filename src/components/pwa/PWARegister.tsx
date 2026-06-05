"use client";

import { useEffect } from "react";

export function PWARegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator) || process.env.NODE_ENV !== "production") return;

    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        registration.update().catch(() => undefined);
      })
      .catch(() => undefined);
  }, []);

  return null;
}
