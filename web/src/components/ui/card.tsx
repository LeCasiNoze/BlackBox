import * as React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Card({ className = "", ...props }: CardProps) {
  const classes =
    "rounded-2xl border border-white/15 bg-black " + className;
  return <div className={classes} {...props} />;
}

