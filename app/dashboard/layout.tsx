import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = await auth.getSession({ fetchOptions: { headers: await headers() } });
  if (!session) {
    redirect("/auth/login?callbackUrl=/dashboard");
  }

  return (
    <>
      <Navbar />
      <main style={{ paddingTop: "68px", minHeight: "calc(100vh - 68px)" }}>
        {children}
      </main>
      <Footer />
    </>
  );
}
