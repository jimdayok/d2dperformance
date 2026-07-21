"use client";
import { useState } from "react";

export function MediaUploader({ siteSlug }: { siteSlug: string }) {
  const [message, setMessage] = useState("");
  async function upload(formData: FormData) { formData.set("siteSlug", siteSlug); setMessage("Uploading…"); const response = await fetch("/api/cms/media", { method: "POST", body: formData }); const result = await response.json(); setMessage(response.ok ? "Image uploaded to the private draft library." : result.error); }
  return <form action={upload} className="grid gap-4 rounded-2xl border border-black/10 bg-white p-6"><label className="text-sm font-medium">Image<input name="file" type="file" accept="image/jpeg,image/png,image/webp" required className="mt-2 block w-full rounded-xl border border-dashed border-black/20 p-5" /></label><label className="text-sm font-medium">Alt text<input name="altText" className="mt-2 w-full rounded-xl border border-black/15 px-4 py-3" /></label><label className="flex items-center gap-2 text-sm"><input name="decorative" value="true" type="checkbox" /> This image is decorative</label><label className="text-sm font-medium">Caption (optional)<input name="caption" className="mt-2 w-full rounded-xl border border-black/15 px-4 py-3" /></label><button className="w-fit rounded-lg bg-[#18201d] px-4 py-2 text-sm font-semibold text-white">Upload image</button><p aria-live="polite" className="text-sm text-black/60">{message}</p></form>;
}
