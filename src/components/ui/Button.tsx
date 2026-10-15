import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Link, type LinkProps } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "accent";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-primary text-on-primary hover:bg-primary-hover shadow-soft",
  secondary: "bg-surface text-ink border border-line-strong hover:bg-surface-2",
  ghost: "text-ink hover:bg-surface-2",
  danger: "bg-[#c4372c] text-white hover:bg-[#a92d23] shadow-soft",
  accent: "bg-accent text-[#1b1405] hover:brightness-105 shadow-soft",
};
const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-[0.8125rem] gap-1.5",
  md: "h-11 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2.5",
  icon: "h-10 w-10 p-0",
};
export const buttonClasses = (
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  extra?: string,
) =>
  cn(
    "inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap rounded-control font-medium transition duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    sizes[size],
    extra,
  );

interface Common {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  children?: ReactNode;
}
type BtnProps = Common &
  ButtonHTMLAttributes<HTMLButtonElement> & { to?: undefined };
type LinkBtnProps = Common &
  Omit<LinkProps, "children"> & { to: LinkProps["to"] };

export const Button = forwardRef<HTMLButtonElement, BtnProps | LinkBtnProps>(
  function Button(props, ref) {
    const {
      variant = "primary",
      size = "md",
      loading,
      icon,
      children,
      className,
      ...rest
    } = props as BtnProps & { className?: string };
    const content = (
      <>
        {loading ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          icon
        )}
        {children}
      </>
    );
    if ((props as LinkBtnProps).to !== undefined) {
      const { to, ...linkRest } = rest as unknown as LinkBtnProps;
      return (
        <Link
          to={to}
          className={buttonClasses(variant, size, className)}
          {...linkRest}
        >
          {content}
        </Link>
      );
    }
    const {
      disabled,
      type = "button",
      ...btn
    } = rest as ButtonHTMLAttributes<HTMLButtonElement>;
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={buttonClasses(variant, size, className)}
        {...btn}
      >
        {content}
      </button>
    );
  },
);

export function Spinner({ className }: { className?: string }) {
  return (
    <Loader2
      className={cn("size-5 animate-spin text-muted", className)}
      aria-hidden
    />
  );
}
