"use client";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
export function CustomerLogo({
  organizationId,
  revision,
  filename,
  disabled,
  onMessage,
}: {
  organizationId: string;
  revision: number | null;
  filename: string | null;
  disabled: boolean;
  onMessage: (message: string) => void;
}) {
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  async function save(form: FormData) {
    if (!revision) return;
    setSaving(true);
    form.set("organizationId", organizationId);
    form.set("expected", String(revision));
    try {
      const response = await fetch("/api/digital-reports/logo", {
        method: "POST",
        body: form,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      onMessage(
        "Logo settings saved. Regenerate pending PDF drafts and review them again.",
      );
      router.refresh();
    } catch (error) {
      onMessage(
        error instanceof Error ? error.message : "Logo could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <section className="rounded border border-stone-200 bg-white p-5">
      <h2 className="font-display text-2xl">Personalize the report</h2>
      <p className="mt-2 text-sm text-stone-600">
        Your customer&apos;s logo appears alongside D2D on every page.
        Previously generated PDFs keep their original logo.
      </p>
      {filename ? (
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <Image
            unoptimized
            src={`/api/digital-reports/logo?organizationId=${organizationId}&revision=${revision}`}
            alt="Saved customer logo"
            width={160}
            height={90}
            className="h-24 w-40 object-contain"
          />
          <p className="text-sm">{filename}</p>
        </div>
      ) : (
        <p className="mt-3 text-sm">No customer logo saved yet.</p>
      )}
      <form
        key={`${organizationId}-${revision}`}
        className="mt-4 flex flex-wrap items-end gap-3"
        onSubmit={async (event) => {
          event.preventDefault();
          await save(new FormData(event.currentTarget));
        }}
      >
        <label className="block text-sm">
          Customer logo (PNG, JPG or WebP, up to 2 MB)
          <input
            className="mt-2 block max-w-full"
            type="file"
            name="logo"
            accept="image/png,image/jpeg,image/webp"
            required
            disabled={disabled || saving || !revision}
          />
        </label>
        <button
          className="rounded bg-[#17201d] px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
          disabled={disabled || saving || !revision}
        >
          Save customer logo
        </button>
      </form>
      {!revision ? (
        <p className="mt-2 text-sm text-stone-600">
          Save the enrollment first, then add the customer&apos;s logo.
        </p>
      ) : null}
      {filename ? (
        <button
          className="mt-3 text-sm underline"
          disabled={disabled || saving}
          onClick={async () => {
            const form = new FormData();
            form.set("remove", "true");
            await save(form);
          }}
        >
          Remove customer logo
        </button>
      ) : null}
    </section>
  );
}
