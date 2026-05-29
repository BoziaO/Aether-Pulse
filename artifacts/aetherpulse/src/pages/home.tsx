import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { GlassCard } from "@/components/ui/glass-card";
import { Activity, Plus, Search, Menu } from "lucide-react";
import { motion } from "framer-motion";
import { GlassButton } from "@/components/ui/glass-button";
import { Link } from "wouter";

export default function HomePage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-[100dvh] w-full bg-background overflow-hidden relative pb-[72px] md:pb-0">
      <div className="absolute top-[-20%] left-[20%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      
      <Sidebar isMobileOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col relative z-10">
        <div className="md:hidden p-4 flex items-center justify-between z-20 absolute top-0 left-0 right-0 bg-background/50 backdrop-blur-md border-b border-white/5">
          <div className="flex items-center gap-2">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 rounded-lg bg-white/5 border border-white/10" data-testid="mobile-menu-btn">
              <Menu className="w-5 h-5 text-white" />
            </button>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-4 md:p-8 mt-16 md:mt-0">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-xl w-full text-center"
          >
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-8 border border-white/10 shadow-[0_0_50px_rgba(124,58,237,0.1)] relative">
              <Activity className="w-10 h-10 md:w-12 md:h-12 text-primary" />
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-3xl" />
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-4">
              Welcome to the Aether
            </h2>
            <p className="text-base md:text-lg text-muted-foreground mb-10 px-4 md:px-0">
              Select a room from the sidebar to connect, or create a new space for your team.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <GlassCard className="p-6 flex flex-col items-center justify-center text-center hover:bg-white/10 transition-colors cursor-pointer group">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Plus className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Initialize Room</h3>
                <p className="text-sm text-muted-foreground">Create a new private space</p>
              </GlassCard>
              
              <Link href="/room/join" className="block">
                <GlassCard className="h-full p-6 flex flex-col items-center justify-center text-center hover:bg-white/10 transition-colors cursor-pointer group">
                  <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Search className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Join Room</h3>
                  <p className="text-sm text-muted-foreground">Enter via invite code</p>
                </GlassCard>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
      
      <MobileNav />
    </div>
  );
}