import { cn } from "@/lib/utils";

export function StatusIndicator({ status, className }: { status?: string, className?: string }) {
  const getStatusColor = (s: string) => {
    switch (s) {
      case "online": return "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]";
      case "away": return "bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)]";
      case "busy": return "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]";
      case "offline":
      default: return "bg-gray-500";
    }
  };

  return (
    <span className={cn("inline-block w-3 h-3 rounded-full border-2 border-background", getStatusColor(status || "offline"), className)} />
  );
}
