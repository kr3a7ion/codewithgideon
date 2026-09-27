import React from "react";
import { cn } from "./cn";

export type ButtonVariant = "primary" | "accent" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";
type Variant = ButtonVariant;
type Size = ButtonSize;

const variants: Record<Variant, string> = {
  primary:
    "bg-blue-900 text-white hover:bg-blue-800 shadow-sm dark:bg-teal-500 dark:text-slate-950 dark:hover:bg-teal-400",
  accent: "bg-orange-600 text-white hover:bg-orange-700 shadow-sm",
  secondary:
    "border border-slate-200 bg-white text-blue-900 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800",
  ghost:
    "text-blue-900 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800",
  danger: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm rounded-lg gap-1.5",
  md: "h-11 px-5 text-sm rounded-xl gap-2",
  lg: "h-14 px-7 text-base rounded-2xl gap-2.5",
};

/** Classes for anything that should look like a button (e.g. links). */
export const buttonClass = ({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
}: {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  className?: string;
} = {}) =>
  cn(
    "inline-flex items-center justify-center font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60",
    variants[variant],
    sizes[size],
    fullWidth && "w-full",
    className,
  );

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      fullWidth = false,
      leftIcon,
      rightIcon,
      className,
      children,
      disabled,
      type = "button",
      ...rest
    },
    ref,
  ) => (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClass({ variant, size, fullWidth, className })}
      {...rest}
    >
      {loading ? (
        <span
          aria-hidden
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"
        />
      ) : (
        leftIcon
      )}
      {children}
      {!loading && rightIcon}
    </button>
  ),
);
Button.displayName = "Button";
