import { SetPasswordForm } from "@/components/site-manager/set-password-form";

export default function SetPasswordPage() {
  return (
    <main className="grid min-h-screen place-items-center px-5 py-12">
      <section className="w-full max-w-md rounded-3xl border border-black/10 bg-white p-8 shadow-[0_30px_90px_rgba(20,30,25,0.1)]">
        <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[#9a5f34]">D2D Performance</p>
        <h1 className="mt-3 font-display text-4xl font-semibold">Choose your password</h1>
        <p className="mt-3 mb-8 text-sm leading-6 text-black/60">Use at least 12 characters. This password is stored securely by Supabase and is never visible to D2D.</p>
        <SetPasswordForm />
      </section>
    </main>
  );
}
