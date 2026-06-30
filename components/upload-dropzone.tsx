"use client";

import { FileStack, Upload } from "lucide-react";
import type { DiscoveryUploadMetadata } from "@/types/brand-discovery";

type UploadDropzoneProps = {
  label: string;
  accept?: string;
  multiple?: boolean;
  files: DiscoveryUploadMetadata[];
  onChange: (files: DiscoveryUploadMetadata[], rawFiles: File[]) => void;
};

export function UploadDropzone({
  label,
  accept,
  multiple,
  files,
  onChange,
}: UploadDropzoneProps) {
  function handleFiles(fileList: FileList | null) {
    if (!fileList) {
      return;
    }

    const nextFiles = Array.from(fileList).map((file) => ({
      id: `${file.name}-${file.lastModified}-${file.size}`,
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
    }));

    onChange(nextFiles, Array.from(fileList));
  }

  return (
    <div className="rounded-[1.5rem] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-panel)] p-5">
      <label className="block cursor-pointer">
        <input
          type="file"
          className="sr-only"
          accept={accept}
          multiple={multiple}
          onChange={(event) => handleFiles(event.target.files)}
        />
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-[var(--color-ink)]">{label}</p>
            <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
              Choose logos, documents, photos, or reference files you want us to review.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-[var(--color-card)] px-4 py-2 text-sm font-medium text-[var(--color-ink)] shadow-[0_8px_20px_rgba(15,23,42,0.06)]">
            <Upload className="h-4 w-4 text-[var(--color-accent)]" />
            Choose files
          </span>
        </div>
      </label>

      {files.length ? (
        <div className="mt-4 space-y-2">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-3 rounded-2xl bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-muted)]"
            >
              <FileStack className="h-4 w-4 text-[var(--color-accent)]" />
              <span className="font-medium text-[var(--color-ink)]">{file.name}</span>
              <span>{Math.max(1, Math.round(file.size / 1024))} KB</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
