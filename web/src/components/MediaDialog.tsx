import { useEffect, useRef, type ReactNode } from "react";

/** Native modal: focus containment, Escape, inert background and focus restoration. */
export function MediaDialog({ children, onClose, label, className = "" }: {
  children: ReactNode; onClose: () => void; label: string; className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const backdropPress = useRef(false);
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.body.style.overflow = overflow;
      previous?.focus({ preventScroll: true });
    };
  }, []);
  return <dialog ref={ref} className={`media-dialog ${className}`} aria-label={label}
    onCancel={(event) => { event.preventDefault(); onClose(); }}
    onPointerDown={(event) => { backdropPress.current = event.target === event.currentTarget; }}
    onPointerCancel={() => { backdropPress.current = false; }}
    onClick={(event) => {
      if (backdropPress.current && event.target === event.currentTarget) onClose();
      backdropPress.current = false;
    }}>
    {children}
  </dialog>;
}
