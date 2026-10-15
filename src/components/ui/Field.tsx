import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n";

const control =
  "w-full rounded-control border bg-surface text-ink placeholder:text-faint transition-colors duration-150 " +
  "border-line-strong hover:border-faint focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30 " +
  "disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-faint aria-[invalid=true]:border-danger aria-[invalid=true]:ring-danger/20";

interface FieldShellProps {
  label?: ReactNode;
  error?: string;
  hint?: ReactNode;
  optional?: boolean;
  required?: boolean;
  className?: string;
  id: string;
  children: ReactNode;
}
export function FieldShell({
  label,
  error,
  hint,
  optional,
  className,
  id,
  children,
}: FieldShellProps) {
  const t = useT();
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label
          htmlFor={id}
          className="flex items-baseline justify-between gap-2 text-sm font-medium text-ink"
        >
          <span>{label}</span>
          {optional && (
            <span className="text-xs font-normal text-faint">
              {t("common.optional")}
            </span>
          )}
        </label>
      )}
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p
          id={`${id}-err`}
          role="alert"
          className="text-xs font-medium text-[var(--red-fg)]"
        >
          {error}
        </p>
      )}
    </div>
  );
}
const describedBy = (id: string, error?: string, hint?: ReactNode) =>
  error ? `${id}-err` : hint ? `${id}-hint` : undefined;

interface BaseProps {
  label?: ReactNode;
  error?: string;
  hint?: ReactNode;
  optional?: boolean;
  wrapperClassName?: string;
}

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> &
    BaseProps & { startAdornment?: ReactNode }
>(function Input(
  {
    label,
    error,
    hint,
    optional,
    wrapperClassName,
    className,
    startAdornment,
    id,
    ...rest
  },
  ref,
) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <FieldShell
      id={fid}
      label={label}
      error={error}
      hint={hint}
      optional={optional}
      className={wrapperClassName}
    >
      <div className="relative">
        {startAdornment && (
          <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-faint">
            {startAdornment}
          </span>
        )}
        <input
          ref={ref}
          id={fid}
          aria-invalid={!!error || undefined}
          aria-describedby={describedBy(fid, error, hint)}
          className={cn(
            control,
            "h-11 px-3.5 text-sm",
            startAdornment && "ps-10",
            className,
          )}
          {...rest}
        />
      </div>
    </FieldShell>
  );
});

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement> & BaseProps
>(function Textarea(
  { label, error, hint, optional, wrapperClassName, className, id, ...rest },
  ref,
) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <FieldShell
      id={fid}
      label={label}
      error={error}
      hint={hint}
      optional={optional}
      className={wrapperClassName}
    >
      <textarea
        ref={ref}
        id={fid}
        rows={4}
        aria-invalid={!!error || undefined}
        aria-describedby={describedBy(fid, error, hint)}
        className={cn(
          control,
          "min-h-24 resize-y px-3.5 py-2.5 text-sm leading-relaxed",
          className,
        )}
        {...rest}
      />
    </FieldShell>
  );
});

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement> & BaseProps
>(function Select(
  {
    label,
    error,
    hint,
    optional,
    wrapperClassName,
    className,
    id,
    children,
    ...rest
  },
  ref,
) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <FieldShell
      id={fid}
      label={label}
      error={error}
      hint={hint}
      optional={optional}
      className={wrapperClassName}
    >
      <div className="relative">
        <select
          ref={ref}
          id={fid}
          aria-invalid={!!error || undefined}
          aria-describedby={describedBy(fid, error, hint)}
          className={cn(
            control,
            "h-11 appearance-none ps-3.5 pe-10 text-sm",
            className,
          )}
          {...rest}
        >
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute inset-y-0 end-3 my-auto size-4 text-faint"
          aria-hidden
        />
      </div>
    </FieldShell>
  );
});

/** Native date input: its value is already a plain YYYY-MM-DD string, which is exactly what the API wants. */
export const DateField = forwardRef<
  HTMLInputElement,
  Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & BaseProps
>(function DateField(props, ref) {
  return (
    <Input
      ref={ref}
      type="date"
      className="num min-w-0 [color-scheme:light] dark:[color-scheme:dark]"
      {...props}
    />
  );
});

export function Checkbox({
  label,
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { label: ReactNode }) {
  const id = useId();
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-center gap-2.5 text-sm",
        className,
      )}
    >
      <input
        id={id}
        type="checkbox"
        className="size-4 rounded border-line-strong accent-[var(--primary)]"
        {...rest}
      />
      {label}
    </label>
  );
}
