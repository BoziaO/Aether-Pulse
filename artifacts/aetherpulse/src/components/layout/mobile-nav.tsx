import { Link, useLocation } from "wouter";
import { Home, Hash, User, Settings } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export function MobileNav() {
  const [location] = useLocation();
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-t border-white/10 pb-safe pt-2 px-4">
      <div className="flex items-center justify-around">
        <Link href="/">
          <div className={`flex flex-col items-center p-2 rounded-xl transition-colors ${location === "/" ? "text-primary" : "text-muted-foreground hover:text-white"}`} data-testid="mobile-nav-home">
            <Home className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-medium">Home</span>
          </div>
        </Link>
        <Link href="/room/join">
          <div className={`flex flex-col items-center p-2 rounded-xl transition-colors ${location.startsWith("/room") ? "text-primary" : "text-muted-foreground hover:text-white"}`} data-testid="mobile-nav-rooms">
            <Hash className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-medium">Rooms</span>
          </div>
        </Link>
        <Link href={`/profile/${user.id}`}>
          <div className={`flex flex-col items-center p-2 rounded-xl transition-colors ${location.startsWith("/profile") ? "text-primary" : "text-muted-foreground hover:text-white"}`} data-testid="mobile-nav-profile">
            <User className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-medium">Profile</span>
          </div>
        </Link>
        <Link href="/settings">
          <div className={`flex flex-col items-center p-2 rounded-xl transition-colors ${location === "/settings" ? "text-primary" : "text-muted-foreground hover:text-white"}`} data-testid="mobile-nav-settings">
            <Settings className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-medium">Settings</span>
          </div>
        </Link>
      </div>
    </div>
  );
}