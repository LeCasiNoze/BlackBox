import type { ReactNode } from "react";

/** Keep fields stable while collapsing, and remove closed content from keyboard navigation. */
export function DisclosureBody({ open, id, children }: { open: boolean; id: string; children: ReactNode }) {
  return <div id={id} className="disclosure-body" data-open={open} aria-hidden={!open} inert={!open}>
    <div className="disclosure-clip">{children}</div>
  </div>;
}
