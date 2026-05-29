import { Sidebar } from "@/components/layout/sidebar";
import { useGetRoom, getGetRoomQueryKey, useListMessages, getListMessagesQueryKey, useSendMessage } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { useWebRTC, ScreenShareMode } from "@/hooks/use-webrtc";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useRef, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { Camera, Mic, MonitorUp, PhoneOff, Settings2, Video, Send, User, Users, ShieldAlert, MessageSquare, ChevronDown, Check, Gamepad2, Film, Monitor } from "lucide-react";
import { getSocket } from "@/lib/socket";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { useQueryClient } from "@tanstack/react-query";
import { AvatarFallback } from "@/components/ui/avatar-fallback";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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

  const { 
    localStream, 
    remoteStream, 
    isConnected, 
    isCameraEnabled,
    isMicEnabled,
    toggleCamera, 
    toggleMicrophone, 
    toggleScreenShare, 
    isScreenSharing,
    screenShareMode,
    startLocalStream,
    SCREEN_SHARE_PRESETS,
  } = useWebRTC(roomId!, user?.id);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [chatInput, setChatInput] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(window.innerWidth >= 768);
  const [quality, setQuality] = useState("1080p");
  const [isPushToTalkHeld, setIsPushToTalkHeld] = useState(false);

  useEffect(() => {
    startLocalStream();
  }, [startLocalStream]);

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

  // Push to talk handling
  useEffect(() => {
    const pushToTalkEnabled = localStorage.getItem("pushToTalk") === "true";
    if (!pushToTalkEnabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        setIsPushToTalkHeld(true);
        if (!isMicEnabled) toggleMicrophone();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        setIsPushToTalkHeld(false);
        if (isMicEnabled) toggleMicrophone();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isMicEnabled, toggleMicrophone]);

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

  const handleQualityChange = (newQuality: string) => {
    setQuality(newQuality);
    let constraints = {};
    if (newQuality === "360p") constraints = { width: 640, height: 360, frameRate: 30 };
    if (newQuality === "480p") constraints = { width: 854, height: 480, frameRate: 30 };
    if (newQuality === "720p") constraints = { width: 1280, height: 720, frameRate: 60 };
    if (newQuality === "1080p") constraints = { width: 1920, height: 1080, frameRate: 60 };
    if (newQuality === "1440p") constraints = { width: 2560, height: 1440, frameRate: 60 };
    
    startLocalStream(constraints);
  };

  if (isRoomLoading) {
    return <div className="flex h-screen items-center justify-center bg-background"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div></div>;
  }

  if (!room) return <div className="flex h-screen items-center justify-center bg-background text-white">Room not found</div>;

  const ChatContent = (
    <div className="h-full bg-sidebar/30 backdrop-blur-xl flex flex-col z-20 overflow-hidden w-full">
      <div className="p-4 border-b border-white/5 font-semibold text-white flex justify-between items-center">
        <span>Room Chat</span>
        <button className="md:hidden p-2 bg-white/5 rounded-md" onClick={() => setIsChatOpen(false)}>
          <ChevronDown className="w-4 h-4" />
        </button>
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
      
      <div className="p-4 border-t border-white/5 bg-background/50 pb-safe">
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
    </div>
  );

  return (
    <div className="flex h-[100dvh] w-full bg-background overflow-hidden relative">
      <div className="hidden md:block">
        <Sidebar />
      </div>
      
      {/* Main Stream Area */}
      <div className="flex-1 flex flex-col relative z-10 w-full h-[100dvh]">
        {/* Top Bar */}
        <div className="absolute md:relative top-0 left-0 right-0 h-16 border-b border-white/5 flex items-center justify-between px-4 md:px-6 bg-background/50 backdrop-blur-md z-20">
          <div className="flex items-center gap-3 md:gap-4">
            <h2 className="text-base md:text-lg font-bold text-white tracking-tight">{room.name}</h2>
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
              <Users className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-gray-300">{room.memberCount}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 md:px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
              <ShieldAlert className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-[10px] md:text-xs font-medium text-gray-300 hidden md:inline">Invite: {room.inviteCode}</span>
              <span className="text-[10px] md:text-xs font-medium text-gray-300 md:hidden">{room.inviteCode}</span>
            </div>
          </div>
          <GlassButton onClick={() => setIsChatOpen(!isChatOpen)} className="w-8 h-8 md:w-10 md:h-10 p-0 rounded-lg md:hidden">
            <MessageSquare className="w-4 h-4 md:w-5 md:h-5" />
          </GlassButton>
          <GlassButton onClick={() => setIsChatOpen(!isChatOpen)} className="hidden md:flex w-10 h-10 p-0 rounded-lg">
            <User className="w-5 h-5" />
          </GlassButton>
        </div>

        {/* Video Area */}
        <div className="flex-1 md:p-6 flex flex-col justify-center relative overflow-hidden bg-black md:bg-black/40 h-full pt-16 md:pt-0 pb-24 md:pb-0">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/20 to-background pointer-events-none z-0" />
          
          <div className="w-full h-full md:max-w-6xl md:mx-auto md:aspect-video md:rounded-2xl overflow-hidden relative z-10 border-0 md:border md:border-white/5 md:shadow-2xl md:bg-black/60 md:backdrop-blur-xl flex items-center justify-center">
            {remoteStream ? (
              <video 
                ref={remoteVideoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                <Video className="w-12 h-12 md:w-16 md:h-16 mb-4 opacity-20" />
                <p className="text-sm md:text-base">Waiting for peer connection...</p>
              </div>
            )}
            
            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col md:flex-row gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <button className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-xs font-semibold text-white flex items-center gap-1.5 shadow-lg hover:bg-white/10 transition-colors">
                    <Settings2 className="w-3.5 h-3.5" />
                    {quality}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-1 bg-card border-white/10" align="start">
                  <div className="flex flex-col gap-1">
                    {["360p", "480p", "720p", "1080p", "1440p"].map(q => (
                      <button
                        key={q}
                        onClick={() => handleQualityChange(q)}
                        className="flex items-center justify-between px-3 py-2 rounded-md text-sm hover:bg-white/10 text-white"
                      >
                        <span>{q} {q === "720p" || q === "1080p" || q === "1440p" ? "60FPS" : "30FPS"}</span>
                        {quality === q && <Check className="w-4 h-4 text-primary" />}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              {isConnected && (
                <div className="px-3 py-1 rounded-full bg-red-500/20 backdrop-blur-md border border-red-500/50 text-xs font-bold text-red-500 flex items-center gap-1.5 shadow-[0_0_10px_rgba(239,68,68,0.3)] animate-pulse w-fit">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  LIVE
                </div>
              )}
            </div>

            {/* PiP Local Video */}
            <div className="absolute bottom-4 right-4 w-24 md:w-48 aspect-[3/4] md:aspect-video bg-black/80 rounded-xl overflow-hidden border border-white/20 shadow-2xl backdrop-blur-md">
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
                  <User className="w-6 h-6 md:w-8 md:h-8 text-muted-foreground opacity-50" />
                </div>
              )}
              {(!isCameraEnabled || !isMicEnabled) && (
                <div className="absolute bottom-1 left-1 flex gap-1">
                  {!isMicEnabled && <div className="p-1 bg-red-500/80 rounded backdrop-blur-sm"><Mic className="w-3 h-3 text-white" /></div>}
                  {!isCameraEnabled && <div className="p-1 bg-red-500/80 rounded backdrop-blur-sm"><Camera className="w-3 h-3 text-white" /></div>}
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="absolute bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 z-20">
            <GlassCard className="px-4 md:px-6 py-3 md:py-4 rounded-full md:rounded-3xl flex items-center gap-3 md:gap-4 bg-background/80 backdrop-blur-xl border-white/10 shadow-2xl">
              <GlassButton 
                onClick={toggleMicrophone} 
                className={`w-12 h-12 md:w-14 md:h-14 rounded-full md:rounded-2xl ${isMicEnabled ? 'bg-white/10 text-white' : 'bg-red-500/20 text-red-500 hover:bg-red-500/30'}`}
                data-testid="toggle-mic"
              >
                <Mic className="w-5 h-5 md:w-6 md:h-6" />
              </GlassButton>
              <GlassButton 
                onClick={toggleCamera} 
                className={`w-12 h-12 md:w-14 md:h-14 rounded-full md:rounded-2xl ${isCameraEnabled ? 'bg-white/10 text-white' : 'bg-red-500/20 text-red-500 hover:bg-red-500/30'}`}
                data-testid="toggle-camera"
              >
                <Camera className="w-5 h-5 md:w-6 md:h-6" />
              </GlassButton>
              {isScreenSharing ? (
                <GlassButton
                  onClick={() => toggleScreenShare()}
                  className="w-12 h-12 md:w-14 md:h-14 rounded-full md:rounded-2xl bg-primary/50 border-primary shadow-[0_0_15px_rgba(124,58,237,0.5)]"
                  data-testid="toggle-screen"
                >
                  <MonitorUp className="w-5 h-5 md:w-6 md:h-6" />
                </GlassButton>
              ) : (
                <Popover>
                  <PopoverTrigger asChild>
                    <GlassButton
                      className="w-12 h-12 md:w-14 md:h-14 rounded-full md:rounded-2xl bg-white/5 hover:bg-white/10"
                      data-testid="toggle-screen"
                    >
                      <MonitorUp className="w-5 h-5 md:w-6 md:h-6" />
                    </GlassButton>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-2 bg-card border-white/10" align="center" side="top">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-2 pb-2">Screen Share Mode</p>
                    <div className="flex flex-col gap-1">
                      {(["gaming", "movie", "default"] as ScreenShareMode[]).map((mode) => {
                        const preset = SCREEN_SHARE_PRESETS[mode];
                        const Icon = mode === "gaming" ? Gamepad2 : mode === "movie" ? Film : Monitor;
                        return (
                          <button
                            key={mode}
                            onClick={() => toggleScreenShare(mode)}
                            className="flex items-start gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-white/10 transition-colors group"
                          >
                            <div className={`mt-0.5 p-1.5 rounded-lg ${mode === "gaming" ? "bg-green-500/20 text-green-400" : mode === "movie" ? "bg-blue-500/20 text-blue-400" : "bg-white/10 text-gray-300"}`}>
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-white">{preset.label}</p>
                              <p className="text-[11px] text-muted-foreground">{preset.description}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </PopoverContent>
                </Popover>
              )}
              <div className="w-px h-6 md:h-8 bg-white/10 mx-1 md:mx-2" />
              <Link href="/">
                <GlassButton variant="destructive" className="w-12 h-12 md:w-14 md:h-14 rounded-full md:rounded-2xl">
                  <PhoneOff className="w-5 h-5 md:w-6 md:h-6" />
                </GlassButton>
              </Link>
            </GlassCard>
          </div>
        </div>
      </div>

      {/* Desktop Chat Panel */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="hidden md:flex h-full border-l border-white/5 bg-sidebar/30 backdrop-blur-xl flex-col flex-shrink-0 z-20 overflow-hidden"
          >
            {ChatContent}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Chat Sheet */}
      <Sheet open={isChatOpen && window.innerWidth < 768} onOpenChange={setIsChatOpen}>
        <SheetContent side="bottom" className="h-[80dvh] p-0 bg-transparent border-t border-white/10">
          {ChatContent}
        </SheetContent>
      </Sheet>
    </div>
  );
}