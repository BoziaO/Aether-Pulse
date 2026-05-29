import { Sidebar } from "@/components/layout/sidebar";
import { GlassCard } from "@/components/ui/glass-card";
import { Activity, Plus, Search } from "lucide-react";
import { motion } from "framer-motion";
import { GlassButton } from "@/components/ui/glass-button";
import { Link } from "wouter";

export default function HomePage() {
  return (
    <div className="flex h-[100dvh] w-full bg-background overflow-hidden relative">
      <div className="absolute top-[-20%] left-[20%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      
      <Sidebar />
      
      <div className="flex-1 flex flex-col relative z-10">
        <div className="flex-1 flex items-center justify-center p-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-xl w-full text-center"
          >
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-8 border border-white/10 shadow-[0_0_50px_rgba(124,58,237,0.1)] relative">
              <Activity className="w-12 h-12 text-primary" />
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-3xl" />
            </div>
            
            <h2 className="text-4xl font-bold text-white tracking-tight mb-4">
              Welcome to the Aether
            </h2>
            <p className="text-lg text-muted-foreground mb-10">
              Select a room from the sidebar to connect, or create a new space for your team.
            </p>
            
            <div className="grid grid-cols-2 gap-4">
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
    </div>
  );
}
