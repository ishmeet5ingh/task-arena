import { DashboardNav } from "@/components/layout/DashboardNav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="app-shell min-h-screen lg:p-4 lg:pl-28">
      <DashboardNav />
      {children}
    </main>
  );
}
