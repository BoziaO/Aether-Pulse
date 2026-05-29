import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { useParams, useLocation } from "wouter";
import { useGetUser, getGetUserQueryKey } from "@workspace/api-client-react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { AvatarFallback } from "@/components/ui/avatar-fallback";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { CalendarDays, Edit2, Menu } from "lucide-react";

export default function ProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const id = parseInt(userId || "0", 10);
  const { user: currentUser } = useAuth();
  const [, setLocation] = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const { data: user, isLoading } = useGetUser(id, {
    query: { enabled: !!id, queryKey: getGetUserQueryKey(id) }
  });

  const isOwnProfile = currentUser?.id === id;
  const pronouns = isOwnProfile ? localStorage.getItem("userPronouns") || "" : "";

  if (isLoading) {
    return (
      <div className="flex h-[100dvh] w-full bg-background overflow-hidden">
        <Sidebar isMobileOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-[100dvh] w-full bg-background overflow-hidden">
        <Sidebar isMobileOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <div className="flex-1 flex items-center justify-center text-white">User not found</div>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] w-full bg-background overflow-hidden relative pb-[72px] md:pb-0">
      <Sidebar isMobileOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <div className="flex-1 overflow-y-auto">
        <div className="md:hidden p-4 flex items-center z-20 absolute top-0 left-0 right-0 bg-transparent">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 rounded-lg bg-black/40 backdrop-blur-md border border-white/10" data-testid="mobile-menu-btn">
            <Menu className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="max-w-4xl mx-auto p-4 md:p-8 pt-0 md:pt-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <GlassCard className="overflow-hidden border-white/5">
              {/* Banner */}
              <div className="h-32 md:h-48 w-full relative bg-gradient-to-r from-primary/30 to-accent/30 overflow-hidden" style={user.accentColor ? { backgroundImage: `linear-gradient(to right, ${user.accentColor}40, ${user.accentColor}80)` } : {}}>
                {user.bannerUrl && (
                  <img src={user.bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-80" />
              </div>
              
              <div className="px-4 md:px-8 pb-8 relative">
                <div className="flex justify-between items-end mb-4 md:mb-6">
                  {/* Avatar */}
                  <div className="relative -mt-12 md:-mt-16 w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-background overflow-hidden bg-background">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.displayName} className="w-full h-full object-cover" />
                    ) : (
                      <AvatarFallback name={user.displayName} className="text-3xl md:text-4xl" />
                    )}
                    <StatusIndicator status={user.status} className="absolute bottom-1 right-1 w-4 h-4 md:w-5 md:h-5 border-4" />
                  </div>
                  
                  {isOwnProfile && (
                    <GlassButton onClick={() => setLocation("/settings")} className="gap-2 px-3 md:px-4 text-xs md:text-sm h-8 md:h-10">
                      <Edit2 className="w-3 h-3 md:w-4 md:h-4" /> Edit Profile
                    </GlassButton>
                  )}
                </div>
                
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">{user.displayName}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-muted-foreground font-mono text-sm">@{user.username}</p>
                    {pronouns && (
                      <span className="text-xs bg-white/10 px-2 py-0.5 rounded text-gray-300">{pronouns}</span>
                    )}
                  </div>
                </div>
                
                {user.customStatus && (
                  <div className="mt-4 md:mt-6 p-3 md:p-4 rounded-xl bg-white/5 border border-white/5 text-gray-200 text-sm md:text-base">
                    "{user.customStatus}"
                  </div>
                )}
                
                <div className="mt-6 md:mt-8 space-y-6">
                  <div>
                    <h3 className="text-xs md:text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">About</h3>
                    <p className="text-sm md:text-base text-gray-300 leading-relaxed max-w-2xl">
                      {user.bio || "No biography provided."}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <CalendarDays className="w-4 h-4" />
                    <span>Joined {format(new Date(user.createdAt), "MMMM d, yyyy")}</span>
                  </div>
                  
                  {user.badges && user.badges.length > 0 && (
                    <div>
                      <h3 className="text-xs md:text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Badges</h3>
                      <div className="flex flex-wrap gap-2">
                        {user.badges.map((badge, idx) => {
                          const colors = ["bg-blue-500/20 text-blue-300 border-blue-500/30", "bg-purple-500/20 text-purple-300 border-purple-500/30", "bg-pink-500/20 text-pink-300 border-pink-500/30", "bg-amber-500/20 text-amber-300 border-amber-500/30", "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"];
                          const colorClass = colors[idx % colors.length];
                          return (
                            <div key={idx} className={`px-3 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-1.5 shadow-sm ${colorClass}`}>
                              {badge}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </div>

      <MobileNav />
    </div>
  );
}