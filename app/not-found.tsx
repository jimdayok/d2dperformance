import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-[var(--color-bg)] px-6 py-20 text-[var(--color-ink)]">
      <section className="editorial-frame max-w-2xl p-10 text-center">
        <p className="eyebrow-label">404 · Page not found</p>
        <h1 className="mt-5 font-display text-5xl font-semibold tracking-[-0.04em] sm:text-6xl">
          This page is not part of the current DAY2DAY.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base leading-8 text-[var(--color-muted)]">
          The address may have changed during the D2D Marketing migration. Use
          the current navigation or return to the homepage.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/"
            className="rounded-full bg-[var(--color-accent)] px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-charcoal)]"
          >
            Go home
          </Link>
          <Link
            href="/contact"
            className="rounded-full border border-[var(--color-border)] px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em]"
          >
            Contact D2D
          </Link>
        </div>
      </section>
    </main>
  );
}
