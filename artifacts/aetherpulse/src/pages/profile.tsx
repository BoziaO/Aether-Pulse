import { Sidebar } from "@/components/layout/sidebar";
import { useParams, useLocation } from "wouter";
import { useGetUser, getGetUserQueryKey } from "@workspace/api-client-react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { AvatarFallback } from "@/components/ui/avatar-fallback";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { CalendarDays, Edit2 } from "lucide-react";

export default function ProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const id = parseInt(userId || "0", 10);
  const { user: currentUser } = useAuth();
  const [, setLocation] = useLocation();
  
  const { data: user, isLoading } = useGetUser(id, {
    query: { enabled: !!id, queryKey: getGetUserQueryKey(id) }
  });

  const isOwnProfile = currentUser?.id === id;

  if (isLoading) {
    return (
      <div className="flex h-[100dvh] w-full bg-background overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-[100dvh] w-full bg-background overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center text-white">User not found</div>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] w-full bg-background overflow-hidden relative">
      <Sidebar />
      
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-8 pt-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <GlassCard className="overflow-hidden border-white/5">
              {/* Banner */}
              <div className="h-48 w-full relative bg-gradient-to-r from-primary/30 to-accent/30 overflow-hidden">
                {user.bannerUrl && (
                  <img src={user.bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-80" />
              </div>
              
              <div className="px-8 pb-8 relative">
                <div className="flex justify-between items-end mb-6">
                  {/* Avatar */}
                  <div className="relative -mt-16 w-32 h-32 rounded-full border-4 border-background overflow-hidden bg-background">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.displayName} className="w-full h-full object-cover" />
                    ) : (
                      <AvatarFallback name={user.displayName} className="text-4xl" />
                    )}
                    <StatusIndicator status={user.status} className="absolute bottom-1 right-1 w-5 h-5 border-4" />
                  </div>
                  
                  {isOwnProfile && (
                    <GlassButton onClick={() => setLocation("/settings")} className="gap-2 px-4">
                      <Edit2 className="w-4 h-4" /> Edit Profile
                    </GlassButton>
                  )}
                </div>
                
                <div>
                  <h1 className="text-3xl font-bold text-white tracking-tight">{user.displayName}</h1>
                  <p className="text-muted-foreground mt-1 font-mono text-sm">@{user.username}</p>
                </div>
                
                {user.customStatus && (
                  <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/5 text-gray-200">
                    "{user.customStatus}"
                  </div>
                )}
                
                <div className="mt-8 space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">About</h3>
                    <p className="text-gray-300 leading-relaxed max-w-2xl">
                      {user.bio || "No biography provided."}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <CalendarDays className="w-4 h-4" />
                    <span>Joined {format(new Date(user.createdAt), "MMMM d, yyyy")}</span>
                  </div>
                  
                  {user.badges && user.badges.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Badges</h3>
                      <div className="flex flex-wrap gap-2">
                        {user.badges.map((badge, idx) => (
                          <div key={idx} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-medium text-white flex items-center gap-1.5 shadow-sm">
                            {badge}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
