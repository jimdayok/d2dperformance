import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/site-manager/access";
import { hasSupabaseConfig } from "@/lib/supabase/config";

export default async function AuthenticatedPortalLayout({ children }: { children: React.ReactNode }) {
  if (!hasSupabaseConfig()) redirect("/portal/login");
  const user = await getCurrentUser();
  if (!user) redirect("/portal/login");
  return children;
}
