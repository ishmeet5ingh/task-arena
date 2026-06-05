import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import { PWARegister } from "@/components/pwa/PWARegister";
import "./globals.css";

export const metadata: Metadata = {
  applicationName: "Task Arena",
  title: "Task Arena",
  description: "A premium gamified productivity arena built with Next.js and MongoDB.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Task Arena"
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg"
  },
  other: {
    "apple-mobile-web-app-capable": "yes"
  }
};

export const viewport: Viewport = {
  themeColor: "#07111f",
  viewportFit: "cover"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
        <PWARegister />
        <Toaster richColors theme="dark" position="top-right" />
      </body>
    </html>
  );
}
