import * as React from "react";
import { Slot } from "@radix-ui/react-slot";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?: "default" | "outline";
  size?: "default" | "icon";
}

const base =
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ring-offset-slate-950";

const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
  default: "bg-sky-500 text-white hover:bg-sky-400",
  outline:
    "border border-slate-700 bg-slate-950 text-slate-100 hover:bg-slate-900",
};

const sizes: Record<NonNullable<ButtonProps["size"]>, string> = {
  default: "h-9 px-4 py-2",
  icon: "h-9 w-9",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "default", size = "default", asChild, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    const classes = [
      base,
      variants[variant] ?? variants.default,
      sizes[size] ?? sizes.default,
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return <Comp className={classes} ref={ref} {...props} />;
  }
);

Button.displayName = "Button";
