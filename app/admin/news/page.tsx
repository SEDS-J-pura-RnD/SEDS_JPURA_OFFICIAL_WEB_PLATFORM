import { prisma } from "@/lib/db";
import type { Metadata } from "next";
import NewsClient from "./NewsClient";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { hasAnyPermission, PERMISSIONS } from "@/lib/permissions";

export const metadata: Metadata = { title: "News | Admin" };

async function getAdminNewsData() {
  return await prisma.news.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { name: true } },
    },
  });
}

export default async function AdminNewsPage() {
  const { data: session } = await auth.getSession({ fetchOptions: { headers: await headers() } });
  if (!session) redirect("/auth/login?callbackUrl=/admin/news");

  const allowed = await hasAnyPermission(session.user.id, [
    PERMISSIONS.CREATE_NEWS,
    PERMISSIONS.EDIT_NEWS,
    PERMISSIONS.DELETE_NEWS,
    PERMISSIONS.PUBLISH_NEWS,
  ]);
  if (!allowed) redirect("/admin");

  const news = await getAdminNewsData();

  return <NewsClient initialNews={news} />;
}
