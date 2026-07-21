"use client";

export default function PortalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="grid min-h-screen place-items-center p-6"><div className="max-w-lg rounded-2xl border border-red-200 bg-white p-8"><p className="text-xs font-semibold uppercase tracking-wider text-red-700">Site Manager error</p><h1 className="mt-3 font-display text-3xl font-semibold">This view could not be loaded.</h1><p className="mt-3 text-sm text-black/60">Try again. If the problem continues, contact D2D support with the time and page you were viewing.</p><button onClick={reset} className="mt-6 rounded-lg bg-[#18201d] px-4 py-2 text-sm font-semibold text-white">Try again</button></div></main>;
}
