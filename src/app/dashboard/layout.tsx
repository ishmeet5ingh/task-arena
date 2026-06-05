import { DashboardNav } from "@/components/layout/DashboardNav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen p-4 lg:pl-28">
      <DashboardNav />
      {children}
    </main>
  );
}
