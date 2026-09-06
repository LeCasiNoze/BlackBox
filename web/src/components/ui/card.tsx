import * as React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Card({ className = "", ...props }: CardProps) {
  const classes =
    "bb-surface " + className;
  return <div className={classes} {...props} />;
}

