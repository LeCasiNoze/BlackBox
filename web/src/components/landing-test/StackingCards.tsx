import {
  createContext,
  useContext,
  useRef,
  type PropsWithChildren,
  type HTMLAttributes,
} from "react";
import {
  motion,
  MotionValue,
  useScroll,
  useTransform,
  type UseScrollOptions,
} from "framer-motion";

interface StackingCardsContextValue {
  progress: MotionValue<number>;
  scaleMultiplier?: number;
  totalCards: number;
}

const StackingCardsContext = createContext<StackingCardsContextValue | null>(
  null
);

export function useStackingCardsContext() {
  const context = useContext(StackingCardsContext);
  if (!context)
    throw new Error("StackingCardItem must be used within StackingCards");
  return context;
}

export interface StackingCardsProps
  extends PropsWithChildren,
    HTMLAttributes<HTMLDivElement> {
  scrollOptions?: UseScrollOptions;
  scaleMultiplier?: number;
  totalCards: number;
}

export function StackingCards({
  children,
  className = "",
  scrollOptions,
  scaleMultiplier = 0.03,
  totalCards,
  ...props
}: StackingCardsProps) {
  const targetRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end end"],
    ...scrollOptions,
  });

  return (
    <StackingCardsContext.Provider
      value={{ progress: scrollYProgress, scaleMultiplier, totalCards }}
    >
      <div className={className} ref={targetRef} {...props}>
        {children}
      </div>
    </StackingCardsContext.Provider>
  );
}

export interface StackingCardItemProps
  extends HTMLAttributes<HTMLDivElement>,
    PropsWithChildren {
  index: number;
  topPosition?: string;
}

export function StackingCardItem({
  index,
  topPosition,
  className = "",
  children,
  ...props
}: StackingCardItemProps) {
  const {
    progress,
    scaleMultiplier = 0.03,
    totalCards = 0,
  } = useStackingCardsContext();
  const scaleTo = 1 - (totalCards - index) * scaleMultiplier;
  const rangeScale = [index * (1 / totalCards), 1];
  const scale = useTransform(progress, rangeScale, [1, scaleTo]);
  const top = topPosition ?? `${80 + index * 24}px`;

  return (
    <div className={`sticky top-0 h-full ${className}`} {...props}>
      <motion.div className="relative h-full origin-top" style={{ scale, top }}>
        {children}
      </motion.div>
    </div>
  );
}
