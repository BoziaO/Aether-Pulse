import React from "react";
import { cn } from "@/lib/utils";

export const GlassButton = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'destructive' | 'default' }>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-xl transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none",
          "bg-white/5 backdrop-blur-md border border-white/10 text-white shadow-lg",
          "hover:bg-white/10 hover:shadow-[0_0_15px_rgba(124,58,237,0.3)] hover:border-white/20",
          variant === 'primary' && "bg-primary/80 border-primary/50 hover:bg-primary hover:shadow-[0_0_20px_rgba(124,58,237,0.6)]",
          variant === 'destructive' && "bg-destructive/80 border-destructive/50 hover:bg-destructive hover:shadow-[0_0_20px_rgba(220,38,38,0.6)]",
          className
        )}
        {...props}
      />
    );
  }
);
GlassButton.displayName = "GlassButton";
