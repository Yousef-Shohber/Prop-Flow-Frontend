import { ImagePlus, Loader2, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type DragEvent,
} from "react";
import { useT } from "@/i18n";
import { normalizeError } from "@/lib/errors";
import { cn } from "@/lib/utils";
import type { ImageRef } from "@/types/models";

export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export interface ValidationResult {
  accepted: File[];
  errors: string[];
}
/** Pure validator (unit-tested): type, size and count are checked before anything is sent. */
export function validateImages(
  files: File[],
  opts: { existing: number; maxFiles: number; maxSizeMB: number },
  msg: {
    type: (name: string) => string;
    size: (name: string, mb: number) => string;
    limit: (remaining: number, max: number) => string;
  },
): ValidationResult {
  const errors: string[] = [];
  const ok: File[] = [];
  for (const f of files) {
    if (!ACCEPTED_TYPES.includes(f.type)) errors.push(msg.type(f.name));
    else if (f.size > opts.maxSizeMB * 1024 * 1024)
      errors.push(msg.size(f.name, opts.maxSizeMB));
    else ok.push(f);
  }
  const remaining = Math.max(0, opts.maxFiles - opts.existing);
  if (ok.length > remaining) {
    errors.push(msg.limit(remaining, opts.maxFiles));
    return { accepted: ok.slice(0, remaining), errors };
  }
  return { accepted: ok, errors };
}

interface Pending {
  id: string;
  file: File;
  url: string;
  progress: number;
}

export interface ImageUploaderProps {
  mode: "immediate" | "deferred";
  value: ImageRef[];
  maxFiles: number;
  maxSizeMB?: number;
  /** immediate: upload now (resolves when the server has stored them) */
  onUpload?: (
    files: File[],
    onProgress: (pct: number) => void,
  ) => Promise<unknown>;
  onRemove?: (publicId: string) => Promise<unknown>;
  /** deferred: the parent owns the picked files and sends them with the form */
  onFilesChange?: (files: File[]) => void;
  disabled?: boolean;
  label?: string;
  hint?: string;
  className?: string;
  onError?: (message: string) => void;
}

export function ImageUploader({
  mode,
  value,
  maxFiles,
  maxSizeMB = 5,
  onUpload,
  onRemove,
  onFilesChange,
  disabled,
  label,
  hint,
  className,
  onError,
}: ImageUploaderProps) {
  const t = useT();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<Pending[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [removing, setRemoving] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const urlsRef = useRef<string[]>([]);
  const replaceSingle = maxFiles === 1;

  useEffect(
    () => () => {
      urlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    },
    [],
  );
  useEffect(() => {
    if (mode === "deferred")
      onFilesChange?.(
        pending.map((p) => p.file),
      ); /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [pending, mode]);

  const existing = replaceSingle
    ? 0
    : value.length + (mode === "deferred" ? pending.length : 0);

  const handle = useCallback(
    async (list: FileList | File[] | null) => {
      if (!list || disabled || busy) return;
      const files = Array.from(list);
      const { accepted, errors: errs } = validateImages(
        files,
        {
          existing: mode === "deferred" && replaceSingle ? 0 : existing,
          maxFiles,
          maxSizeMB,
        },
        {
          type: (name) => t("uploader.typeErr", { name }),
          size: (name, mb) => t("uploader.sizeErr", { name, mb }),
          limit: (n, max) => t("uploader.limitErr", { n, max }),
        },
      );
      setErrors(errs);
      if (accepted.length === 0) return;
      const items: Pending[] = accepted.map((file) => {
        const url = URL.createObjectURL(file);
        urlsRef.current.push(url);
        return {
          id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 7)}`,
          file,
          url,
          progress: 0,
        };
      });

      if (mode === "deferred") {
        setPending((p) => (replaceSingle ? items : [...p, ...items]));
        return;
      }

      setPending(items);
      setBusy(true);
      try {
        await onUpload?.(accepted, (pct) =>
          setPending((p) => p.map((x) => ({ ...x, progress: pct }))),
        );
      } catch (e) {
        const msg = t(`err.${normalizeError(e).code}`);
        const text = msg.startsWith("err.") ? t("err.status.400") : msg;
        setErrors([text]);
        onError?.(text);
      } finally {
        setPending([]);
        setBusy(false);
        if (inputRef.current) inputRef.current.value = "";
      }
    },
    [
      disabled,
      busy,
      mode,
      existing,
      maxFiles,
      maxSizeMB,
      onUpload,
      onError,
      replaceSingle,
      t,
    ],
  );

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDrag(false);
    void handle(e.dataTransfer.files);
  };
  const removePending = (id: string) =>
    setPending((p) => p.filter((x) => x.id !== id));
  const removeExisting = async (publicId: string) => {
    setRemoving(publicId);
    try {
      await onRemove?.(publicId);
    } catch (e) {
      const msg = t(`err.${normalizeError(e).code}`);
      const text = msg.startsWith("err.") ? t("err.status.400") : msg;
      setErrors([text]);
      onError?.(text);
    } finally {
      setRemoving(null);
    }
  };

  const total = value.length + (mode === "deferred" ? pending.length : 0);
  const full = !replaceSingle && total >= maxFiles;

  return (
    <div className={cn("space-y-3", className)}>
      {label && (
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-medium">{label}</span>
          <span className="num text-xs text-faint">
            {t("uploader.count", { n: total, max: maxFiles })}
          </span>
        </div>
      )}

      {!full && (
        <label
          htmlFor={inputId}
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={onDrop}
          className={cn(
            "flex cursor-pointer flex-col items-center gap-1.5 rounded-card border-2 border-dashed px-4 py-6 text-center transition-colors focus-within:ring-2 focus-within:ring-ring/40",
            drag
              ? "border-accent bg-accent-soft"
              : "border-line-strong bg-surface-2/50 hover:border-faint",
            (disabled || busy) && "pointer-events-none opacity-60",
          )}
        >
          <ImagePlus className="size-6 text-muted" aria-hidden />
          <span className="text-sm font-medium">{t("uploader.drop")}</span>
          <span className="text-xs text-muted">
            {hint ?? t("uploader.hint", { mb: maxSizeMB })}
          </span>
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept={ACCEPTED_TYPES.join(",")}
            multiple={!replaceSingle}
            className="sr-only"
            disabled={disabled || busy}
            onChange={(e) => {
              void handle(e.target.files);
              if (mode === "deferred" && inputRef.current)
                inputRef.current.value = "";
            }}
          />
        </label>
      )}

      {errors.length > 0 && (
        <ul
          role="alert"
          className="space-y-1 rounded-xl px-3 py-2 text-xs font-medium"
          style={{ background: "var(--red-bg)", color: "var(--red-fg)" }}
        >
          {errors.map((er, i) => (
            <li key={i}>{er}</li>
          ))}
        </ul>
      )}

      {(value.length > 0 || pending.length > 0) && (
        <ul className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-5">
          {!(replaceSingle && pending.length) &&
            value.map((img, i) => (
              <li
                key={img.publicId}
                className="group relative aspect-square overflow-hidden rounded-xl bg-surface-2"
              >
                <img
                  src={img.url}
                  alt=""
                  loading="lazy"
                  className="size-full object-cover"
                />
                {i === 0 && maxFiles > 1 && (
                  <span className="absolute start-1.5 top-1.5 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                    {t("uploader.cover")}
                  </span>
                )}
                {onRemove && (
                  <button
                    type="button"
                    onClick={() => removeExisting(img.publicId)}
                    disabled={disabled || removing === img.publicId}
                    aria-label={t("uploader.remove")}
                    className="absolute end-1.5 top-1.5 flex size-7 items-center justify-center rounded-full bg-black/65 text-white opacity-100 transition hover:bg-black/85 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
                  >
                    {removing === img.publicId ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <X className="size-3.5" />
                    )}
                  </button>
                )}
              </li>
            ))}
          {pending.map((p) => (
            <li
              key={p.id}
              className="relative aspect-square overflow-hidden rounded-xl bg-surface-2"
            >
              <img
                src={p.url}
                alt=""
                className={cn(
                  "size-full object-cover",
                  mode === "immediate" && "opacity-60",
                )}
              />
              {mode === "immediate" ? (
                <div
                  className="absolute inset-x-2 bottom-2"
                  role="progressbar"
                  aria-valuenow={p.progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={p.file.name}
                >
                  <div className="h-1.5 overflow-hidden rounded-full bg-black/30">
                    <div
                      className="h-full rounded-full bg-accent transition-[width] duration-200"
                      style={{ width: `${Math.max(8, p.progress)}%` }}
                    />
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => removePending(p.id)}
                  aria-label={t("uploader.remove")}
                  className="absolute end-1.5 top-1.5 flex size-7 items-center justify-center rounded-full bg-black/65 text-white hover:bg-black/85"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
