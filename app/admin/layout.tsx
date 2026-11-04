import type { Metadata } from "next";
import { getContainer } from "@/lib/di/container";
import { AdminAuthService } from "@/lib/services/admin-auth.service";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata: Metadata = {
  title: "Admin Studio & Content Control | TechSonance",
  description: "Agency content management and automation control panel.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const container = getContainer();
  const authService = container.get(AdminAuthService);
  const session = await authService.getCurrentSession();

  return (
    <AdminShell
      userEmail={session?.email ?? "admin@techsonance.co.in"}
      userRole={session?.role ?? "owner"}
    >
      {children}
    </AdminShell>
  );
}
