import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

export function ActiveNavIndicator({ id }: { id: string }) {
  const reducedMotion = useReducedMotion();
  return <motion.span aria-hidden="true" className="nav-active-indicator"
    layoutId={reducedMotion ? undefined : id}
    transition={{ type: "spring", stiffness: 440, damping: 38 }} />;
}

/** Animate the step without remounting its inputs or delaying interaction. */
export function JourneyStep({ step, children, className = "mt-5 space-y-4" }: { step: number; children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const previous = useRef(step);
  const reduced = useReducedMotion();
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const direction = step >= previous.current ? 1 : -1;
    if (step !== previous.current) {
      const panel = element.closest('.client-quote-panel');
      panel?.scrollTo({ top: 0, behavior: 'instant' });
      const heading = element.querySelector<HTMLElement>('h1, h4');
      heading?.setAttribute('tabindex', '-1');
      heading?.focus({ preventScroll: true });
      // Long booking steps can leave the next heading outside the viewport.
      if (!panel && heading) {
        const bounds = heading.getBoundingClientRect();
        if (bounds.top < 16 || bounds.bottom > window.innerHeight - 100) {
          heading.scrollIntoView({ block: 'start', behavior: 'instant' });
        }
      }
    }
    previous.current = step;
    if (reduced) return;
    const animations = Array.from(element.children).map((child, index) => child.animate(
      [{ opacity: 0, transform: `translateX(${direction * 18}px) translateY(6px)` }, { opacity: 1, transform: 'none' }],
      { duration: 420, delay: index * 55, fill: 'backwards', easing: 'cubic-bezier(.22,1,.36,1)' },
    ));
    return () => animations.forEach(animation => animation.cancel());
  }, [step, reduced]);
  return <div ref={ref} className={`journey-step ${className}`}>{children}</div>;
}

/** Reveal fresh view blocks; never transform containers holding fixed overlays. */
export function InterfaceMotion({ scope, identity }: { scope: string; identity: string }) {
  useEffect(() => {
    const root = document.querySelector(scope);
    if (!root) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const animations = new Set<Animation>();
    let observer: IntersectionObserver | undefined;
    let mutations: MutationObserver | undefined;

    const stop = () => {
      observer?.disconnect();
      mutations?.disconnect();
      animations.forEach((animation) => animation.cancel());
      animations.clear();
    };
    const start = () => {
      stop();
      if (preference.matches || !('IntersectionObserver' in window)) return;
      const seen = new WeakSet<Element>();
      const client = root.matches('.client-shell');
      const selector = client
        ? '.bb-content > section > *, .bb-content > section > .grid > *, .bb-content > section > article > .grid > *'
        : '.admin-section-heading, :scope > section:not(.showcase-section) h2, .showcase-heading';
      observer = new IntersectionObserver((entries) => {
        let order = 0;
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          observer?.unobserve(entry.target);
          const animation = entry.target.animate(
            [{ opacity: 0, transform: `translateY(${client ? 22 : 12}px)` }, { opacity: 1, transform: "none" }],
            { duration: client ? 600 : 420, delay: Math.min(order++ * 65, 260), fill: 'backwards', easing: "cubic-bezier(.22,1,.36,1)" },
          );
          animations.add(animation);
          animation.onfinish = () => animations.delete(animation);
        });
      }, { threshold: 0.12 });
      const discover = () => {
        const targets = Array.from(root.querySelectorAll<HTMLElement>(selector));
        targets.forEach(target => {
          if (seen.has(target)) return;
          seen.add(target);
          if (target.matches('.grid, .journey-step') || target.querySelector('.fixed, dialog') || target.closest('.fixed, dialog, .journey-step')) return;
          // A parent reveal is enough; avoid adding nested movement.
          if (targets.some(parent => parent !== target && parent.contains(target) && !parent.matches('.grid'))) return;
          observer?.observe(target);
        });
      };
      discover();
      if (client) {
        mutations = new MutationObserver(records => {
          if (records.some(record => Array.from(record.addedNodes).some(node => node instanceof HTMLElement))) discover();
        });
        mutations.observe(root, { childList: true, subtree: true });
      }
    };
    start();
    preference.addEventListener("change", start);
    return () => {
      stop();
      preference.removeEventListener("change", start);
    };
  }, [scope, identity]);
  return null;
}
