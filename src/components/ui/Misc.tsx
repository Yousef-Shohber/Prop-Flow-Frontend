import { useState, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/format";

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-card border border-line bg-surface shadow-card",
        className,
      )}
      {...rest}
    />
  );
}
export function CardSection({
  title,
  action,
  children,
  className,
  ...rest
}: {
  title?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
} & Omit<HTMLAttributes<HTMLDivElement>, "title">) {
  return (
    <Card className={cn("p-5 sm:p-6", className)} {...rest}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="text-base font-semibold">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </Card>
  );
}

export function Tag({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md bg-surface-2 px-2 py-0.5 text-xs font-medium text-muted",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Avatar({
  user,
  size = 36,
  className,
}: {
  user?: {
    firstName?: string;
    lastName?: string;
    avatar?: { url: string } | null;
  } | null;
  size?: number;
  className?: string;
}) {
  const style = {
    width: size,
    height: size,
    fontSize: Math.max(11, size * 0.38),
  };
  const url = user?.avatar?.url;
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  if (url && failedUrl !== url) {
    return (
      <img
        src={url}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        onError={() => setFailedUrl(url)}
        style={style}
        className={cn(
          "shrink-0 rounded-full bg-surface-2 object-cover",
          className,
        )}
      />
    );
  }
  return (
    <span
      aria-hidden
      style={style}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-accent-soft font-semibold text-accent-ink",
        className,
      )}
    >
      {initials(user) || "·"}
    </span>
  );
}

export function DescriptionList({
  items,
  className,
}: {
  items: { label: ReactNode; value: ReactNode; wide?: boolean }[];
  className?: string;
}) {
  return (
    <dl className={cn("grid gap-x-8 gap-y-4 sm:grid-cols-2", className)}>
      {items.map((it, i) => (
        <div key={i} className={cn("min-w-0", it.wide && "sm:col-span-2")}>
          <dt className="text-xs font-medium text-faint">{it.label}</dt>
          <dd className="mt-0.5 break-words text-sm text-ink">
            {it.value ?? "—"}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function Banner({
  tone = "amber",
  title,
  children,
  action,
  className,
}: {
  tone?: "amber" | "blue" | "red" | "green";
  title?: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      role="status"
      className={cn(
        "flex flex-wrap items-start gap-x-4 gap-y-2 rounded-card border px-4 py-3 text-sm",
        className,
      )}
      style={{
        background: `var(--${tone}-bg)`,
        color: `var(--${tone}-fg)`,
        borderColor: `color-mix(in srgb, var(--${tone}-dot) 35%, transparent)`,
      }}
    >
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && (
          <div className={cn(title && "mt-0.5", "opacity-95")}>{children}</div>
        )}
      </div>
      {action && <div className="no-print">{action}</div>}
    </div>
  );
}

export function Money({ children }: { children: ReactNode }) {
  return <span className="num whitespace-nowrap">{children}</span>;
}
