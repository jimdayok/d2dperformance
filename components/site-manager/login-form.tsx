export function LoginForm({ next, ssoEnabled = false }: { next?: string; ssoEnabled?: boolean; legacyEnabled?: boolean }) {
  return <div className="space-y-7">{ssoEnabled ? <><a href={`/portal/login/d2d?next=${encodeURIComponent(next ?? "/portal/dashboard")}`} className="portal-primary-button block w-full px-5 py-3.5 text-center font-semibold">Continue with D2D Account</a><p className="mt-4 text-center text-xs leading-5 text-[#796e64]">One sign-in for every D2D service assigned to you.</p></> : <p role="alert">D2D Account sign-in is temporarily unavailable. Contact D2D support.</p>}</div>;
}
