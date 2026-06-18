import { prisma } from "@/lib/db";
import type { Metadata } from "next";
import NewsClient from "./NewsClient";

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
  const news = await getAdminNewsData();

  return <NewsClient initialNews={news} />;
}
