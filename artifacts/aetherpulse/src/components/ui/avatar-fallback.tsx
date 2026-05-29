import { cn } from "@/lib/utils";

export function AvatarFallback({ name, className }: { name?: string, className?: string }) {
  const initials = name ? name.substring(0, 2).toUpperCase() : "?";
  
  return (
    <div className={cn("flex items-center justify-center bg-gradient-to-br from-primary to-accent text-white font-medium rounded-full h-full w-full", className)}>
      {initials}
    </div>
  );
}
