import * as React from "react";
import { cn } from "@/lib/utils";

interface RippleProps {
  x: number;
  y: number;
  size: number;
}

interface TouchRippleProps extends React.HTMLAttributes<HTMLSpanElement> {
  color?: string;
  duration?: number;
  disabled?: boolean;
}

const TouchRipple = React.forwardRef<HTMLSpanElement, TouchRippleProps>(
  ({ className, color = "currentColor", duration = 600, disabled = false, ...props }, ref) => {
    const [ripples, setRipples] = React.useState<RippleProps[]>([]);
    const containerRef = React.useRef<HTMLSpanElement>(null);

    React.useImperativeHandle(ref, () => containerRef.current!);

    const addRipple = React.useCallback(
      (event: React.MouseEvent | React.TouchEvent) => {
        if (disabled) return;

        const container = containerRef.current;
        if (!container) return;

        const rect = container.getBoundingClientRect();
        let x: number, y: number;

        if ("touches" in event) {
          x = event.touches[0].clientX - rect.left;
          y = event.touches[0].clientY - rect.top;
        } else {
          x = event.clientX - rect.left;
          y = event.clientY - rect.top;
        }

        // Calculate ripple size to cover the entire element
        const size = Math.max(rect.width, rect.height) * 2;

        const newRipple: RippleProps = { x, y, size };
        setRipples((prev) => [...prev, newRipple]);

        // Remove ripple after animation
        setTimeout(() => {
          setRipples((prev) => prev.slice(1));
        }, duration);
      },
      [disabled, duration]
    );

    return (
      <span
        ref={containerRef}
        className={cn(
          "absolute inset-0 overflow-hidden rounded-[inherit] pointer-events-none",
          className
        )}
        onMouseDown={addRipple}
        onTouchStart={addRipple}
        {...props}
      >
        {ripples.map((ripple, index) => (
          <span
            key={index}
            className="absolute rounded-full animate-ripple pointer-events-none"
            style={{
              left: ripple.x - ripple.size / 2,
              top: ripple.y - ripple.size / 2,
              width: ripple.size,
              height: ripple.size,
              backgroundColor: color,
              opacity: 0.3,
            }}
          />
        ))}
      </span>
    );
  }
);

TouchRipple.displayName = "TouchRipple";

// Hook to add ripple effect to any component
function useRipple(options: { color?: string; duration?: number; disabled?: boolean } = {}) {
  const { color = "currentColor", duration = 600, disabled = false } = options;
  const [ripples, setRipples] = React.useState<RippleProps[]>([]);
  const containerRef = React.useRef<HTMLElement>(null);

  const handleRipple = React.useCallback(
    (event: React.MouseEvent | React.TouchEvent) => {
      if (disabled) return;

      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      let x: number, y: number;

      if ("touches" in event) {
        x = event.touches[0].clientX - rect.left;
        y = event.touches[0].clientY - rect.top;
      } else {
        x = event.clientX - rect.left;
        y = event.clientY - rect.top;
      }

      const size = Math.max(rect.width, rect.height) * 2;
      const newRipple: RippleProps = { x, y, size };
      setRipples((prev) => [...prev, newRipple]);

      setTimeout(() => {
        setRipples((prev) => prev.slice(1));
      }, duration);
    },
    [disabled, duration]
  );

  const RippleContainer = React.useMemo(
    () => (
      <span className="absolute inset-0 overflow-hidden rounded-[inherit] pointer-events-none">
        {ripples.map((ripple, index) => (
          <span
            key={index}
            className="absolute rounded-full animate-ripple pointer-events-none"
            style={{
              left: ripple.x - ripple.size / 2,
              top: ripple.y - ripple.size / 2,
              width: ripple.size,
              height: ripple.size,
              backgroundColor: color,
              opacity: 0.3,
            }}
          />
        ))}
      </span>
    ),
    [ripples, color]
  );

  return {
    containerRef,
    handleRipple,
    RippleContainer,
    rippleProps: {
      onMouseDown: handleRipple,
      onTouchStart: handleRipple,
    },
  };
}

export { TouchRipple, useRipple };
