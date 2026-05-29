import { Sidebar } from "@/components/layout/sidebar";
import { useGetRoom, getGetRoomQueryKey, useListMessages, getListMessagesQueryKey, useSendMessage } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { useWebRTC } from "@/hooks/use-webrtc";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useRef, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { Camera, Mic, MonitorUp, PhoneOff, Settings2, Video, Send, User, Users, ShieldAlert } from "lucide-react";
import { getSocket } from "@/lib/socket";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { useQueryClient } from "@tanstack/react-query";
import { AvatarFallback } from "@/components/ui/avatar-fallback";

export default function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const { data: room, isLoading: isRoomLoading } = useGetRoom(roomId!, {
    query: { enabled: !!roomId, queryKey: getGetRoomQueryKey(roomId!) }
  });
  
  const { data: messages = [] } = useListMessages(roomId!, {
    query: { enabled: !!roomId, queryKey: getListMessagesQueryKey(roomId!) }
  });
  
  const sendMessage = useSendMessage();

  const { localStream, remoteStream, isConnected, toggleCamera, toggleMicrophone, toggleScreenShare, isScreenSharing } = useWebRTC(roomId!, user?.id);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [chatInput, setChatInput] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(true);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  useEffect(() => {
    const socket = getSocket();
    socket.on("message", () => {
      queryClient.invalidateQueries({ queryKey: getListMessagesQueryKey(roomId!) });
    });
    return () => {
      socket.off("message");
    };
  }, [roomId, queryClient]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    
    sendMessage.mutate({ roomId: roomId!, data: { content: chatInput } }, {
      onSuccess: () => {
        setChatInput("");
        queryClient.invalidateQueries({ queryKey: getListMessagesQueryKey(roomId!) });
      }
    });
  };

  if (isRoomLoading) {
    return <div className="flex h-screen items-center justify-center bg-background"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div></div>;
  }

  if (!room) return <div className="flex h-screen items-center justify-center bg-background text-white">Room not found</div>;

  return (
    <div className="flex h-[100dvh] w-full bg-background overflow-hidden relative">
      <Sidebar />
      
      {/* Main Stream Area */}
      <div className="flex-1 flex flex-col relative z-10">
        {/* Top Bar */}
        <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-background/50 backdrop-blur-md z-20">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold text-white tracking-tight">{room.name}</h2>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
              <Users className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-gray-300">{room.memberCount}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
              <ShieldAlert className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-gray-300">Invite: {room.inviteCode}</span>
            </div>
          </div>
          <GlassButton onClick={() => setIsChatOpen(!isChatOpen)} className="w-10 h-10 p-0 rounded-lg">
            <User className="w-5 h-5" />
          </GlassButton>
        </div>

        {/* Video Area */}
        <div className="flex-1 p-6 flex flex-col justify-center relative overflow-hidden bg-black/40">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/20 to-background pointer-events-none z-0" />
          
          <div className="w-full max-w-6xl mx-auto aspect-video rounded-2xl overflow-hidden relative z-10 border border-white/5 shadow-2xl bg-black/60 backdrop-blur-xl">
            {remoteStream ? (
              <video 
                ref={remoteVideoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                <Video className="w-16 h-16 mb-4 opacity-20" />
                <p>Waiting for peer connection...</p>
              </div>
            )}
            
            {/* Badges */}
            <div className="absolute top-4 left-4 flex gap-2">
              <div className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-xs font-semibold text-white flex items-center gap-1.5 shadow-lg">
                <Settings2 className="w-3.5 h-3.5" />
                {room.quality || '1080p'} 60 FPS
              </div>
              {isConnected && (
                <div className="px-3 py-1 rounded-full bg-red-500/20 backdrop-blur-md border border-red-500/50 text-xs font-bold text-red-500 flex items-center gap-1.5 shadow-[0_0_10px_rgba(239,68,68,0.3)] animate-pulse">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  LIVE
                </div>
              )}
            </div>

            {/* PiP Local Video */}
            <div className="absolute bottom-4 right-4 w-48 aspect-video bg-black/80 rounded-xl overflow-hidden border border-white/20 shadow-2xl backdrop-blur-md">
              {localStream ? (
                <video 
                  ref={localVideoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className="w-full h-full object-cover transform -scale-x-100"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-8 h-8 text-muted-foreground opacity-50" />
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20">
            <GlassCard className="px-6 py-4 rounded-3xl flex items-center gap-4 bg-background/60">
              <GlassButton onClick={toggleMicrophone} className="w-14 h-14 rounded-2xl bg-white/5 hover:bg-white/10">
                <Mic className="w-6 h-6" />
              </GlassButton>
              <GlassButton onClick={toggleCamera} className="w-14 h-14 rounded-2xl bg-white/5 hover:bg-white/10">
                <Camera className="w-6 h-6" />
              </GlassButton>
              <GlassButton onClick={toggleScreenShare} className={`w-14 h-14 rounded-2xl ${isScreenSharing ? 'bg-primary/50 border-primary shadow-[0_0_15px_rgba(124,58,237,0.5)]' : 'bg-white/5'} hover:bg-white/10`}>
                <MonitorUp className="w-6 h-6" />
              </GlassButton>
              <div className="w-px h-8 bg-white/10 mx-2" />
              <Link href="/">
                <GlassButton variant="destructive" className="w-14 h-14 rounded-2xl">
                  <PhoneOff className="w-6 h-6" />
                </GlassButton>
              </Link>
            </GlassCard>
          </div>
        </div>
      </div>

      {/* Right Chat Panel */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="h-full border-l border-white/5 bg-sidebar/30 backdrop-blur-xl flex flex-col flex-shrink-0 z-20 overflow-hidden"
          >
            <div className="p-4 border-b border-white/5 font-semibold text-white">
              Room Chat
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col">
              {messages.map((msg, idx) => {
                const isOwn = msg.userId === user?.id;
                if (msg.type === 'system') {
                  return (
                    <div key={msg.id} className="text-center text-xs text-muted-foreground my-2">
                      {msg.content}
                    </div>
                  );
                }
                
                return (
                  <motion.div 
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-end gap-2 max-w-[85%]">
                      {!isOwn && (
                        <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 mb-1">
                          {msg.user?.avatarUrl ? (
                            <img src={msg.user.avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <AvatarFallback name={msg.user?.displayName || '?'} className="text-[10px]" />
                          )}
                        </div>
                      )}
                      <div>
                        {!isOwn && <p className="text-[10px] text-muted-foreground mb-1 ml-1">{msg.user?.displayName}</p>}
                        <div className={`px-3 py-2 rounded-2xl text-sm ${isOwn ? 'bg-primary text-white rounded-br-sm' : 'bg-white/10 text-gray-200 rounded-bl-sm border border-white/5 backdrop-blur-sm'}`}>
                          {msg.content}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
            
            <div className="p-4 border-t border-white/5 bg-background/50">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type a message..."
                  className="bg-black/30 border-white/10 text-white rounded-xl focus-visible:ring-primary h-10"
                />
                <GlassButton type="submit" variant="primary" className="w-10 h-10 p-0 rounded-xl flex-shrink-0" disabled={!chatInput.trim() || sendMessage.isPending}>
                  <Send className="w-4 h-4" />
                </GlassButton>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
