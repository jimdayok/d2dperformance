import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import { LoginForm } from "@/components/site-manager/login-form";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { getCurrentUser } from "@/lib/site-manager/access";

function safePortalDestination(value?: string) {
  return value?.startsWith("/portal/") && !value.startsWith("//")
    ? value
    : "/portal/dashboard";
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; auth_error?: string }>;
}) {
  const { next, auth_error: authError } = await searchParams;
  const destination = safePortalDestination(next);
  if (hasSupabaseConfig() && await getCurrentUser()) redirect(destination);
  return (
    <main className="portal-login grid min-h-screen place-items-center px-4 py-6 sm:px-6 lg:px-10">
      <section className="grid w-full max-w-6xl overflow-hidden border border-[#201a16]/12 bg-[#fbf7f1] shadow-[0_40px_120px_rgba(34,24,17,0.14)] lg:min-h-[44rem] lg:grid-cols-[0.9fr_1.1fr]">
        <div className="portal-login-story relative flex min-h-[24rem] flex-col overflow-hidden bg-[#17201d] p-8 text-white sm:p-10 lg:p-14">
          <div className="relative z-10 flex items-center gap-3">
            <span className="grid size-12 place-items-center bg-[#d6a77f] text-sm font-semibold tracking-[-0.08em] text-[#17201d]">D2D</span>
            <div><p className="text-[9px] font-semibold uppercase tracking-[0.34em] text-[#d6a77f]">Marketing</p><p className="mt-1 font-display text-2xl leading-none">D2D Account</p></div>
          </div>
          <div className="relative z-10 my-auto py-12">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#d6a77f]">One account for your D2D services</p>
            <h1 className="mt-5 max-w-md font-display text-4xl font-medium leading-[1.03] text-balance sm:text-5xl">Social, brand, and web work in one secure place.</h1>
            <div className="mt-8 grid gap-3 text-sm text-white/66">
              {["Approve marketing plans and social content", "Share sales, specials, and upcoming events", "Open Brand Vault and Web Management"].map((item) => <p key={item} className="flex items-center gap-3"><span className="grid size-5 place-items-center rounded-full border border-[#d6a77f]/45 text-[#d6a77f]"><Check size={11} /></span>{item}</p>)}
            </div>
          </div>
          <p className="relative z-10 text-xs leading-5 text-white/42">Secure content operations by D2D Marketing.</p>
        </div>
        <div className="flex flex-col p-7 sm:p-10 lg:p-14">
          <Link href="/" className="inline-flex items-center gap-2 self-start text-xs font-semibold uppercase tracking-[0.16em] text-[#796b60] transition-colors hover:text-[#9a5f34]"><ArrowLeft size={14} /> Back to D2D Marketing</Link>
          <div className="my-auto py-10">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#9a5f34]">Authorized access</p>
            <h2 className="mt-4 font-display text-4xl font-semibold text-[#171513] sm:text-5xl">Welcome back.</h2>
            <p className="mt-4 mb-9 max-w-md text-sm leading-6 text-[#6d6258]">Sign in once to reach the D2D services assigned to your organization.</p>
            {authError ? <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">D2D Account sign-in could not be completed. Please try again or use the legacy sign-in while setup is being finalized.</p> : null}
            {hasSupabaseConfig() ? <LoginForm next={destination} ssoEnabled={process.env.D2D_SSO_ENABLED === "true"} /> : <p role="alert" className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">Supabase is not configured. Add the documented public URL and anonymous key to enable sign-in.</p>}
          </div>
          <p className="text-xs text-[#877b70]">Need help? <a href="mailto:andrea@d2dmktg.com" className="font-semibold text-[#5d3d29] underline underline-offset-4">Contact D2D support</a></p>
        </div>
      </section>
    </main>
  );
}
