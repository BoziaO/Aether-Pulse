import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useJoinRoom } from "@workspace/api-client-react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { Input } from "@/components/ui/input";
import { Activity } from "lucide-react";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { getListRoomsQueryKey } from "@workspace/api-client-react";

export default function JoinRoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const [, setLocation] = useLocation();
  const [inviteCode, setInviteCode] = useState("");
  const joinRoom = useJoinRoom();
  const queryClient = useQueryClient();

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim() || !roomId) return;
    
    joinRoom.mutate({ roomId, data: { inviteCode } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListRoomsQueryKey() });
        setLocation(`/room/${roomId}`);
      }
    });
  };

  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center bg-background relative overflow-hidden">
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-accent/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center mb-8"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(59,130,246,0.4)]">
            <Activity className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Join Room</h1>
          <p className="text-muted-foreground mt-2 text-center">Enter the invite code to access this space</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <GlassCard className="p-8">
            <form onSubmit={handleJoin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Invite Code</label>
                <Input 
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="Enter code..." 
                  className="bg-black/20 border-white/10 text-white focus-visible:ring-primary focus-visible:border-primary text-center text-xl tracking-widest py-6"
                  autoFocus
                />
              </div>
              
              <div className="flex flex-col gap-3">
                <GlassButton variant="primary" type="submit" className="w-full py-6 text-base font-semibold" disabled={joinRoom.isPending || !inviteCode.trim()}>
                  {joinRoom.isPending ? "Connecting..." : "Authenticate"}
                </GlassButton>
                <GlassButton type="button" onClick={() => setLocation("/")} className="w-full py-4 text-sm">
                  Cancel
                </GlassButton>
              </div>
            </form>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}
