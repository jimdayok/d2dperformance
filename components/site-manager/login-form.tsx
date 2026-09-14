"use client";

import { useActionState } from "react";
import { login, requestPasswordReset, type LoginState } from "@/app/(portal)/portal/login/actions";

const initialState: LoginState = {};

export function LoginForm({ next, ssoEnabled = false, legacyEnabled = false }: { next?: string; ssoEnabled?: boolean; legacyEnabled?: boolean }) {
  const [state, loginAction, pending] = useActionState(login, initialState);
  const [resetState, resetAction, resetting] = useActionState(requestPasswordReset, initialState);
  const showLegacySignIn = !ssoEnabled || legacyEnabled;
  return (
    <div className="space-y-7">
      {ssoEnabled ? (
        <div>
          <a
            href={`/portal/login/d2d?next=${encodeURIComponent(next ?? "/portal/dashboard")}`}
            className="portal-primary-button block w-full px-5 py-3.5 text-center font-semibold"
          >
            Sign in to D2D Account
          </a>
          {showLegacySignIn ? <div className="my-6 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8b7e72]">
            <span className="h-px flex-1 bg-[#2b211b]/10" />
            Temporary email sign-in
            <span className="h-px flex-1 bg-[#2b211b]/10" />
          </div> : <p className="mt-4 text-center text-xs leading-5 text-[#796e64]">Use the same D2D Account for every service assigned to you.</p>}
        </div>
      ) : null}
      {showLegacySignIn ? <><form action={loginAction} className="space-y-5">
        {next ? <input type="hidden" name="next" value={next} /> : null}
        <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-[#4d443d]" htmlFor="email">Email address
          <input id="email" name="email" type="email" autoComplete="email" required className="portal-field mt-2 w-full px-4 py-3.5 text-sm normal-case tracking-normal" />
        </label>
        <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-[#4d443d]" htmlFor="password">Password
          <input id="password" name="password" type="password" autoComplete="current-password" required minLength={8} className="portal-field mt-2 w-full px-4 py-3.5 text-sm normal-case tracking-normal" />
        </label>
        {state.error ? <p role="alert" className="text-sm text-red-700">{state.error}</p> : null}
        <button disabled={pending} className="portal-primary-button w-full px-5 py-3.5 font-semibold disabled:opacity-60">{pending ? "Signing in…" : "Enter D2D Account"}</button>
      </form>
      <form action={resetAction} className="border-t border-[#2b211b]/10 pt-6">
        <p className="mb-3 text-xs leading-5 text-[#796e64]">Forgot your password? Enter your email and we’ll send a secure reset link.</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input name="email" type="email" aria-label="Email for password reset" placeholder="Email address" className="portal-field min-w-0 flex-1 px-4 py-3 text-sm" />
          <button disabled={resetting} className="portal-secondary-button px-4 py-3 text-sm font-semibold">{resetting ? "Sending…" : "Send reset"}</button>
        </div>
        <p aria-live="polite" className="mt-2 text-sm text-[#6d6258]">{resetState.error ?? resetState.message}</p>
      </form></> : null}
    </div>
  );
}
