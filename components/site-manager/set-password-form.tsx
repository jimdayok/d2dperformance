"use client";

import { useActionState } from "react";
import { setPassword, type SetPasswordState } from "@/app/(portal)/portal/(authenticated)/set-password/actions";

const initialState: SetPasswordState = {};

export function SetPasswordForm() {
  const [state, action, pending] = useActionState(setPassword, initialState);
  return (
    <form action={action} className="space-y-5">
      <label className="block text-sm font-medium" htmlFor="new-password">New password
        <input id="new-password" name="password" type="password" autoComplete="new-password" required minLength={12} className="mt-2 w-full rounded-xl border border-black/15 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-[#9a5f34]" />
      </label>
      <label className="block text-sm font-medium" htmlFor="confirm-password">Confirm new password
        <input id="confirm-password" name="confirmation" type="password" autoComplete="new-password" required minLength={12} className="mt-2 w-full rounded-xl border border-black/15 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-[#9a5f34]" />
      </label>
      {state.error ? <p role="alert" className="text-sm text-red-700">{state.error}</p> : null}
      <button disabled={pending} className="w-full rounded-xl bg-[#18201d] px-5 py-3 font-semibold text-white disabled:opacity-60">{pending ? "Saving…" : "Save password"}</button>
    </form>
  );
}
