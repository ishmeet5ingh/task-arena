import { AdminUserDetailView } from "@/components/layout/AdminUserDetailView";

export default async function AdminUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdminUserDetailView id={id} />;
}
