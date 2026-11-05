import { redirect } from "next/navigation";
import { getContainer } from "@/lib/di/container";
import { AdminAuthService } from "@/lib/services/admin-auth.service";

export default async function AdminRootPage() {
  const container = getContainer();
  const authService = container.get(AdminAuthService);
  const session = await authService.getCurrentSession();

  if (!session) {
    redirect("/admin/login");
  }

  redirect("/admin/dashboard");
}
