import * as React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Card({ className = "", ...props }: CardProps) {
  const classes =
    "rounded-2xl border border-slate-800/70 bg-slate-950/90 backdrop-blur " +
    className;
  return <div className={classes} {...props} />;
}
