import { redirect } from "next/navigation";
import { LoginForm } from "@/components/site-manager/login-form";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { getCurrentUser } from "@/lib/site-manager/access";

export default async function LoginPage() {
  if (hasSupabaseConfig() && await getCurrentUser()) redirect("/portal/dashboard");
  return (
    <main className="grid min-h-screen place-items-center px-5 py-12">
      <section className="w-full max-w-md rounded-3xl border border-black/10 bg-white p-8 shadow-[0_30px_90px_rgba(20,30,25,0.1)]">
        <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[#9a5f34]">D2D Performance</p>
        <h1 className="mt-3 font-display text-4xl font-semibold">Site Manager</h1>
        <p className="mt-3 mb-8 text-sm leading-6 text-black/60">Sign in to edit, preview, review, and publish approved website content.</p>
        {hasSupabaseConfig() ? <LoginForm /> : <p role="alert" className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">Supabase is not configured. Add the documented public URL and anonymous key to enable sign-in.</p>}
      </section>
    </main>
  );
}
