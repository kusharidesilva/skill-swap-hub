"use client";

import ModalPortal from "@/components/ui/modal-portal";

type PreviewFile = {
  title: string;
  url: string;
  contentType?: string;
  fileName?: string;
};

export default function AdminFilePreviewModal({
  file,
  onClose,
}: {
  file: PreviewFile | null;
  onClose: () => void;
}) {
  if (!file) {
    return null;
  }

  const previewKind = resolvePreviewKind(file);

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-[90] overflow-y-auto bg-slate-950/40 px-4 py-6 backdrop-blur-md"
        onClick={onClose}
      >
        <div
          className="mx-auto flex h-[calc(100vh-1.5rem)] w-full max-w-[min(960px,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_30px_100px_rgba(15,23,42,0.28)] sm:h-[calc(100vh-3rem)]"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                Evidence Preview
              </p>
              <h3 className="mt-1 truncate text-lg font-semibold text-slate-900">
                {file.title}
              </h3>
              {file.fileName ? (
                <p className="mt-1 truncate text-sm text-slate-500">{file.fileName}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
              aria-label="Close preview"
            >
              <CloseIcon />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-auto bg-slate-50 p-4">
            {previewKind === "image" ? (
              <div className="flex h-full items-start justify-center overflow-auto rounded-2xl bg-white p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={file.url}
                  alt={file.fileName || file.title}
                  className="h-auto max-h-full w-auto max-w-[min(100%,720px)] rounded-xl object-contain"
                />
              </div>
            ) : previewKind === "pdf" ? (
              <div className="h-full overflow-auto rounded-2xl border border-slate-200 bg-white">
                <iframe
                  src={file.url}
                  title={file.title}
                  className="min-h-full w-full bg-white"
                />
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                  <FileIcon />
                </div>
                <p className="mt-4 text-base font-semibold text-slate-900">
                  This file can&apos;t be previewed inline.
                </p>
                <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                  You can still open it directly from storage in the browser if needed.
                </p>
                <a
                  href={file.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-[#2f66e7] px-4 text-sm font-semibold text-white transition hover:bg-[#2457cc]"
                >
                  Open File
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}

function resolvePreviewKind(file: PreviewFile) {
  const normalizedType = file.contentType?.toLowerCase() || "";
  const normalizedName = file.fileName?.toLowerCase() || file.url.toLowerCase();

  if (
    normalizedType.startsWith("image/") ||
    /\.(png|jpe?g|webp|gif|bmp|svg)(\?|$)/.test(normalizedName)
  ) {
    return "image";
  }

  if (
    normalizedType.includes("pdf") ||
    /\.pdf(\?|$)/.test(normalizedName)
  ) {
    return "pdf";
  }

  return "other";
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-7 w-7"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6" />
      <path d="M9 17h4" />
    </svg>
  );
}
