"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  forwardRef,
  type ReactNode,
  type ComponentPropsWithoutRef,
} from "react";
import { cn } from "@/lib/utils";

// Reduced Motion Detection with useSyncExternalStore
const ReducedMotionContext = createContext<boolean>(false);

function subscribeReducedMotion(callback: () => void) {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

function getReducedMotionSnapshot() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getReducedMotionServerSnapshot() {
  return false;
}

export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot
  );
}

export function MotionConfig({
  reducedMotion = false,
  children,
}: {
  reducedMotion?: boolean;
  children: ReactNode;
}) {
  const systemReduced = useReducedMotion();
  return (
    <ReducedMotionContext.Provider value={reducedMotion || systemReduced}>
      {children}
    </ReducedMotionContext.Provider>
  );
}

// Animation Variants / Presets
export interface MotionTransition {
  duration?: number;
  delay?: number;
  ease?: string;
}

export interface MotionStyleProps {
  opacity?: number;
  x?: number | string;
  y?: number | string;
  scale?: number;
  rotate?: number;
}

export interface MotionComponentProps {
  initial?: MotionStyleProps | "hidden";
  animate?: MotionStyleProps | "visible";
  exit?: MotionStyleProps;
  whileHover?: MotionStyleProps | "lift" | "glow" | "scale";
  whileTap?: MotionStyleProps | "press";
  transition?: MotionTransition;
}

function computeTransform(props?: MotionStyleProps): string {
  if (!props) return "";
  const parts: string[] = [];
  if (props.x !== undefined) parts.push(`translateX(${typeof props.x === "number" ? `${props.x}px` : props.x})`);
  if (props.y !== undefined) parts.push(`translateY(${typeof props.y === "number" ? `${props.y}px` : props.y})`);
  if (props.scale !== undefined) parts.push(`scale(${props.scale})`);
  if (props.rotate !== undefined) parts.push(`rotate(${props.rotate}deg)`);
  return parts.join(" ");
}

// Generic Motion Factory
function createMotionComponent<T extends keyof React.JSX.IntrinsicElements>(tag: T) {
  const Component = forwardRef<
    HTMLElement,
    ComponentPropsWithoutRef<T> & MotionComponentProps
  >(function MotionElement(
    {
      className,
      style,
      initial,
      animate,
      whileHover,
      whileTap,
      transition,
      children,
      ...rest
    },
    ref
  ) {
    const isReduced = useContext(ReducedMotionContext);
    const [isMounted, setIsMounted] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [isTapped, setIsTapped] = useState(false);

    useEffect(() => {
      // Trigger mount transition on client
      const timer = setTimeout(() => setIsMounted(true), 20);
      return () => clearTimeout(timer);
    }, []);

    // Base target state
    const currentProps: MotionStyleProps = isMounted
      ? typeof animate === "object"
        ? animate || {}
        : { opacity: 1, y: 0, x: 0, scale: 1 }
      : typeof initial === "object"
      ? initial || {}
      : { opacity: 0, y: 8, scale: 0.98 };

    // Apply hover or tap modifications
    let finalProps = { ...currentProps };
    if (!isReduced) {
      if (isHovered && whileHover) {
        if (whileHover === "lift") finalProps.y = -4;
        else if (whileHover === "glow") finalProps.scale = 1.02;
        else if (whileHover === "scale") finalProps.scale = 1.04;
        else if (typeof whileHover === "object") finalProps = { ...finalProps, ...whileHover };
      }
      if (isTapped && whileTap) {
        if (whileTap === "press") finalProps.scale = 0.97;
        else if (typeof whileTap === "object") finalProps = { ...finalProps, ...whileTap };
      }
    }

    const duration = isReduced ? 0 : transition?.duration ?? 250;
    const delay = isReduced ? 0 : transition?.delay ?? 0;
    const ease = transition?.ease ?? "cubic-bezier(0.16, 1, 0.3, 1)";

    const dynamicStyle: React.CSSProperties = {
      ...style,
      opacity: isReduced ? 1 : finalProps.opacity,
      transform: isReduced ? undefined : computeTransform(finalProps),
      transition: isReduced
        ? "none"
        : `opacity ${duration}ms ${ease} ${delay}ms, transform ${duration}ms ${ease} ${delay}ms, box-shadow ${duration}ms ${ease}`,
      willChange: isReduced ? undefined : "transform, opacity",
    };

    return React.createElement(
      tag,
      {
        ref,
        className: cn(
          "transition-gpu",
          whileHover === "glow" && isHovered && "shadow-[0_0_25px_-4px_rgba(255,107,53,0.35)]",
          className
        ),
        style: dynamicStyle,
        onMouseEnter: (e: React.MouseEvent) => {
          setIsHovered(true);
          // @ts-expect-error pass through existing handler
          rest.onMouseEnter?.(e);
        },
        onMouseLeave: (e: React.MouseEvent) => {
          setIsHovered(false);
          setIsTapped(false);
          // @ts-expect-error pass through existing handler
          rest.onMouseLeave?.(e);
        },
        onMouseDown: (e: React.MouseEvent) => {
          setIsTapped(true);
          // @ts-expect-error pass through existing handler
          rest.onMouseDown?.(e);
        },
        onMouseUp: (e: React.MouseEvent) => {
          setIsTapped(false);
          // @ts-expect-error pass through existing handler
          rest.onMouseUp?.(e);
        },
        ...rest,
      },
      children
    );
  });

  Component.displayName = `Motion.${tag}`;
  return Component;
}

export const Motion = {
  div: createMotionComponent("div"),
  button: createMotionComponent("button"),
  section: createMotionComponent("section"),
  span: createMotionComponent("span"),
  article: createMotionComponent("article"),
  aside: createMotionComponent("aside"),
  nav: createMotionComponent("nav"),
  header: createMotionComponent("header"),
  footer: createMotionComponent("footer"),
};

// Preset helpers
export const motionPresets = {
  fadeUp: {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 300, ease: "cubic-bezier(0.16, 1, 0.3, 1)" },
  },
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 250 },
  },
  scaleUp: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 250, ease: "cubic-bezier(0.16, 1, 0.3, 1)" },
  },
  slideInRight: {
    initial: { opacity: 0, x: 24 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 300, ease: "cubic-bezier(0.16, 1, 0.3, 1)" },
  },
  hoverLift: {
    whileHover: "lift" as const,
    whileTap: "press" as const,
  },
  hoverGlow: {
    whileHover: "glow" as const,
    whileTap: "press" as const,
  },
};
