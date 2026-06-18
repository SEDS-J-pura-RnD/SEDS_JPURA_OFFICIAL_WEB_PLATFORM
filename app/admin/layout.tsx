import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/permissions";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = await auth.getSession({ fetchOptions: { headers: await headers() } });
  if (!session) redirect("/auth/login?callbackUrl=/admin");

  const hasAccess = await isAdmin(session.user.id);
  if (!hasAccess) redirect("/dashboard");

  return (
    <div className="admin-layout">
      <AdminSidebar user={session.user} />
      <main className="admin-main">{children}</main>
    </div>
  );
}
