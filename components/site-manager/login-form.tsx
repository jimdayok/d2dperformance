"use client";

import { useActionState } from "react";
import { login, requestPasswordReset, type LoginState } from "@/app/(portal)/portal/login/actions";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, loginAction, pending] = useActionState(login, initialState);
  const [resetState, resetAction, resetting] = useActionState(requestPasswordReset, initialState);
  return (
    <div className="space-y-6">
      <form action={loginAction} className="space-y-5">
        <label className="block text-sm font-medium" htmlFor="email">Email address
          <input id="email" name="email" type="email" autoComplete="email" required className="mt-2 w-full rounded-xl border border-black/15 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-[#9a5f34]" />
        </label>
        <label className="block text-sm font-medium" htmlFor="password">Password
          <input id="password" name="password" type="password" autoComplete="current-password" required minLength={8} className="mt-2 w-full rounded-xl border border-black/15 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-[#9a5f34]" />
        </label>
        {state.error ? <p role="alert" className="text-sm text-red-700">{state.error}</p> : null}
        <button disabled={pending} className="w-full rounded-xl bg-[#18201d] px-5 py-3 font-semibold text-white disabled:opacity-60">{pending ? "Signing in…" : "Sign in"}</button>
      </form>
      <form action={resetAction}>
        <input name="email" type="email" aria-label="Email for password reset" placeholder="Email for password reset" className="w-full rounded-xl border border-black/15 bg-white px-4 py-3" />
        <button disabled={resetting} className="mt-3 text-sm font-semibold underline underline-offset-4">Reset password</button>
        <p aria-live="polite" className="mt-2 text-sm text-black/65">{resetState.error ?? resetState.message}</p>
      </form>
    </div>
  );
}
