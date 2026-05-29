import React, { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { AvatarFallback } from "@/components/ui/avatar-fallback";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { useListRooms, getListRoomsQueryKey, useCreateRoom } from "@workspace/api-client-react";
import { Activity, Plus, Settings, Users, Hash } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useQueryClient } from "@tanstack/react-query";
import { Sheet, SheetContent } from "@/components/ui/sheet";

export interface SidebarProps {
  isMobileOpen?: boolean;
  onClose?: () => void;
}

function SidebarComponent({ isMobileOpen = false, onClose }: SidebarProps) {
  const { user } = useAuth();
  const { data: rooms = [] } = useListRooms({ query: { queryKey: getListRoomsQueryKey() } });
  const [isNewRoomOpen, setIsNewRoomOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const createRoom = useCreateRoom();
  const queryClient = useQueryClient();

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;
    createRoom.mutate({ data: { name: newRoomName } }, {
      onSuccess: () => {
        setIsNewRoomOpen(false);
        setNewRoomName("");
        queryClient.invalidateQueries({ queryKey: getListRoomsQueryKey() });
      }
    });
  };

  const SidebarContent = (
    <div className="w-full md:w-72 h-[100dvh] flex flex-col border-r border-white/10 bg-sidebar/50 backdrop-blur-xl">
      <div className="p-6 flex items-center gap-3 border-b border-white/5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-[0_0_15px_rgba(124,58,237,0.3)]">
          <Activity className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-xl font-bold text-white tracking-tight">AetherPulse</h1>
      </div>

      <div className="p-4 flex-1 overflow-y-auto overflow-x-hidden">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Rooms</span>
          <Dialog open={isNewRoomOpen} onOpenChange={setIsNewRoomOpen}>
            <DialogTrigger asChild>
              <button className="text-muted-foreground hover:text-white transition-colors p-1 rounded-md hover:bg-white/10" data-testid="add-room-btn">
                <Plus className="w-4 h-4" />
              </button>
            </DialogTrigger>
            <DialogContent className="bg-card border-white/10 text-white sm:max-w-md backdrop-blur-xl">
              <DialogHeader>
                <DialogTitle>Initialize New Room</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateRoom} className="space-y-4 pt-4">
                <Input 
                  placeholder="Enter room designation" 
                  value={newRoomName}
                  onChange={e => setNewRoomName(e.target.value)}
                  className="bg-black/20 border-white/10 text-white focus-visible:ring-primary"
                  autoFocus
                  data-testid="room-name-input"
                />
                <GlassButton variant="primary" type="submit" className="w-full" disabled={createRoom.isPending || !newRoomName.trim()} data-testid="create-room-submit">
                  {createRoom.isPending ? "Initializing..." : "Create Workspace"}
                </GlassButton>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-1">
          {rooms.map(room => (
            <Link key={room.id} href={`/room/${room.id}`} className="block" onClick={onClose}>
              <div className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group" data-testid={`room-link-${room.id}`}>
                <div className="w-10 h-10 rounded-lg bg-black/20 flex items-center justify-center border border-white/5 group-hover:border-primary/30 group-hover:shadow-[0_0_10px_rgba(124,58,237,0.2)] transition-all">
                  <Hash className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-200 truncate group-hover:text-white transition-colors">{room.name}</p>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Users className="w-3 h-3" />
                    <span>{room.memberCount} members</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
          {rooms.length === 0 && (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No active rooms.
            </div>
          )}
        </div>
      </div>

      {user && (
        <div className="p-4 border-t border-white/5 pb-20 md:pb-4">
          <Link href={`/profile/${user.id}`} className="block" onClick={onClose}>
            <GlassCard className="p-3 flex items-center gap-3 hover:bg-white/10 transition-colors cursor-pointer border-transparent hover:border-white/10">
              <div className="relative w-10 h-10 rounded-full flex-shrink-0">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.displayName} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <AvatarFallback name={user.displayName} />
                )}
                <StatusIndicator status={user.status} className="absolute bottom-0 right-0 w-3 h-3" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{user.displayName}</p>
                <p className="text-xs text-muted-foreground truncate">{user.customStatus || user.status}</p>
              </div>
              <Link href="/settings" className="text-muted-foreground hover:text-white p-2 rounded-md hover:bg-white/10 transition-colors" onClick={e => { e.stopPropagation(); onClose?.(); }}>
                <Settings className="w-4 h-4" />
              </Link>
            </GlassCard>
          </Link>
        </div>
      )}
    </div>
  );

  return (
    <>
      <div className="hidden md:block">
        {SidebarContent}
      </div>
      <Sheet open={isMobileOpen} onOpenChange={(open) => { if (!open) onClose?.(); }}>
        <SheetContent side="left" className="p-0 border-r border-white/10 bg-transparent sm:max-w-[300px] w-full max-w-[300px]">
          {SidebarContent}
        </SheetContent>
      </Sheet>
    </>
  );
}

export const Sidebar = React.memo(SidebarComponent);