import { Sidebar } from "@/components/layout/sidebar";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useUpdateUser, getGetMeQueryKey, useLogout } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { LogOut, UserCircle, Palette, Monitor, Mic, Bell, Shield, X, Lock } from "lucide-react";
import { useLocation } from "wouter";
import { AvatarFallback } from "@/components/ui/avatar-fallback";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Slider } from "@/components/ui/slider";

export default function SettingsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const updateUser = useUpdateUser();
  const logout = useLogout();
  const [, setLocation] = useLocation();

  const [activeSection, setActiveSection] = useState("profile");
  const [isMobileList, setIsMobileList] = useState(true);

  // Profile Form State
  const [displayName, setDisplayName] = useState("");
  const [customStatus, setCustomStatus] = useState("");
  const [bio, setBio] = useState("");
  const [pronouns, setPronouns] = useState("");
  const [accentColor, setAccentColor] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");

  const isInitialized = useRef(false);

  useEffect(() => {
    if (user && !isInitialized.current) {
      setDisplayName(user.displayName);
      setCustomStatus(user.customStatus || "");
      setBio(user.bio || "");
      setAccentColor(user.accentColor || "#7c3aed");
      setPronouns(localStorage.getItem("userPronouns") || "");
      setAvatarUrl(user.avatarUrl || "");
      setBannerUrl(user.bannerUrl || "");
      isInitialized.current = true;
    }
  }, [user]);

  const handleSaveProfile = () => {
    if (!user) return;
    localStorage.setItem("userPronouns", pronouns);
    updateUser.mutate({ 
      userId: user.id, 
      data: { 
        displayName, 
        bio: bio || undefined, 
        customStatus: customStatus || undefined,
        accentColor: accentColor || undefined,
      } 
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        toast.success("Profile updated");
      }
    });
  };

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        queryClient.clear();
        setLocation("/auth");
      }
    });
  };

  const handleSectionClick = (section: string) => {
    setActiveSection(section);
    setIsMobileList(false);
  };

  if (!user) return null;

  const renderSectionContent = () => {
    switch (activeSection) {
      case "account":
        return (
          <div className="space-y-6 max-w-2xl">
            <h2 className="text-xl font-bold text-white mb-6">My Account</h2>
            
            <GlassCard className="p-6 relative overflow-hidden">
              <div className="h-24 absolute top-0 left-0 right-0 bg-primary/20" style={{ backgroundColor: accentColor ? `${accentColor}40` : undefined }} />
              <div className="relative pt-12 flex justify-between items-end">
                <div className="flex items-end gap-4">
                  <div className="w-20 h-20 rounded-full border-4 border-background overflow-hidden bg-background">
                    {user.avatarUrl ? <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" /> : <AvatarFallback name={user.displayName} />}
                  </div>
                  <div className="mb-2">
                    <h3 className="text-xl font-bold text-white">{user.displayName}</h3>
                    <p className="text-sm text-muted-foreground">@{user.username}</p>
                  </div>
                </div>
                <GlassButton className="mb-2" onClick={() => setActiveSection("profile")}>Edit User Profile</GlassButton>
              </div>
              
              <div className="mt-8 space-y-4 bg-black/40 p-4 rounded-xl border border-white/5">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">USERNAME</p>
                    <p className="text-sm text-gray-200">@{user.username}</p>
                  </div>
                  <GlassButton className="px-4 py-1 text-sm">Edit</GlassButton>
                </div>
                <div className="w-full h-px bg-white/5" />
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">EMAIL</p>
                    <p className="text-sm text-gray-200">Add email address</p>
                  </div>
                  <GlassButton className="px-4 py-1 text-sm">Edit</GlassButton>
                </div>
              </div>
            </GlassCard>

            <div className="space-y-4 pt-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase">Password and Authentication</h3>
              <div className="flex gap-4">
                <Dialog>
                  <DialogTrigger asChild>
                    <GlassButton variant="primary" className="px-6">Change Password</GlassButton>
                  </DialogTrigger>
                  <DialogContent className="bg-card border-white/10 text-white">
                    <DialogHeader><DialogTitle>Update Password</DialogTitle></DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <label className="text-sm text-muted-foreground">Current Password</label>
                        <Input type="password" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm text-muted-foreground">New Password</label>
                        <Input type="password" />
                      </div>
                      <GlassButton variant="primary" className="w-full" onClick={() => toast.success("Password updated")}>Save Password</GlassButton>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div className="space-y-4 pt-8 border-t border-white/5">
              <h3 className="text-xs font-bold text-red-500 uppercase">Danger Zone</h3>
              <GlassButton variant="destructive" className="px-6" onClick={() => toast.error("Account deletion is disabled in preview")}>Delete Account</GlassButton>
            </div>
          </div>
        );

      case "profile":
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white mb-6">User Profile</h2>
            
            <div className="flex flex-col lg:flex-row gap-8 items-start">
              <div className="flex-1 space-y-6 w-full max-w-xl">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Display Name</label>
                  <Input value={displayName} onChange={e => setDisplayName(e.target.value)} className="bg-black/20" />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Pronouns</label>
                  <Input value={pronouns} onChange={e => setPronouns(e.target.value)} placeholder="Add your pronouns" maxLength={40} className="bg-black/20" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Avatar</label>
                    <Dialog>
                      <DialogTrigger asChild>
                        <GlassButton className="w-full justify-start">Change Avatar</GlassButton>
                      </DialogTrigger>
                      <DialogContent className="bg-card border-white/10 text-white">
                        <DialogHeader><DialogTitle>Update Avatar</DialogTitle></DialogHeader>
                        <Input placeholder="Image URL" value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} />
                        <GlassButton onClick={() => toast.success("Feature coming soon")}>Save</GlassButton>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Profile Banner</label>
                    <Dialog>
                      <DialogTrigger asChild>
                        <GlassButton className="w-full justify-start">Change Banner</GlassButton>
                      </DialogTrigger>
                      <DialogContent className="bg-card border-white/10 text-white">
                        <DialogHeader><DialogTitle>Update Banner</DialogTitle></DialogHeader>
                        <Input placeholder="Image URL" value={bannerUrl} onChange={e => setBannerUrl(e.target.value)} />
                        <GlassButton onClick={() => toast.success("Feature coming soon")}>Save</GlassButton>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase">About Me</label>
                  <Textarea value={bio} onChange={e => setBio(e.target.value)} maxLength={190} className="bg-black/20 min-h-[100px] resize-none" />
                  <div className="text-xs text-right text-muted-foreground">{bio.length}/190</div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Custom Status</label>
                  <Input value={customStatus} onChange={e => setCustomStatus(e.target.value)} placeholder="What's on your mind?" className="bg-black/20" />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Accent Color</label>
                  <div className="flex flex-wrap gap-2">
                    {["#7c3aed", "#3b82f6", "#4f46e5", "#ec4899", "#06b6d4", "#10b981", "#ef4444", "#f97316"].map(c => (
                      <button key={c} onClick={() => setAccentColor(c)} className={`w-8 h-8 rounded-md border-2 transition-all ${accentColor === c ? 'border-white scale-110' : 'border-transparent hover:scale-105'}`} style={{ backgroundColor: c }} />
                    ))}
                    <div className="flex items-center gap-2 ml-2">
                      <Input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)} className="w-8 h-8 p-0 border-0 rounded-md overflow-hidden cursor-pointer" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview Card */}
              <div className="w-full lg:w-80 flex-shrink-0 lg:sticky lg:top-8">
                <h3 className="text-xs font-bold text-muted-foreground uppercase mb-4">Preview</h3>
                <GlassCard className="overflow-hidden border-white/10 shadow-2xl">
                  <div className="h-24 w-full bg-gradient-to-r from-primary/30 to-accent/30" style={{ backgroundColor: accentColor ? `${accentColor}40` : undefined, backgroundImage: bannerUrl ? `url(${bannerUrl})` : undefined, backgroundSize: 'cover' }} />
                  <div className="px-4 pb-4">
                    <div className="relative -mt-10 w-20 h-20 rounded-full border-[6px] border-card overflow-hidden bg-background mb-2">
                      {(avatarUrl || user.avatarUrl) ? <img src={avatarUrl || (user.avatarUrl ?? undefined)} alt="" className="w-full h-full object-cover" /> : <AvatarFallback name={displayName} className="text-2xl" />}
                      <StatusIndicator status={user.status} className="absolute bottom-0 right-0 w-4 h-4 border-[3px]" />
                    </div>
                    <div className="bg-black/40 p-3 rounded-lg border border-white/5">
                      <h2 className="font-bold text-white truncate">{displayName || user.username}</h2>
                      <div className="text-xs text-muted-foreground truncate">{user.username} {pronouns && `· ${pronouns}`}</div>
                      {(customStatus || bio) && <div className="mt-3 pt-3 border-t border-white/5 space-y-2">
                        {customStatus && <div className="text-sm text-gray-200">"{customStatus}"</div>}
                        {bio && <div className="text-xs text-gray-400 whitespace-pre-wrap">{bio}</div>}
                      </div>}
                    </div>
                  </div>
                </GlassCard>
              </div>
            </div>
            
            <div className="pt-6 border-t border-white/5">
              <GlassButton variant="primary" onClick={handleSaveProfile} disabled={updateUser.isPending}>
                {updateUser.isPending ? "Saving..." : "Save Changes"}
              </GlassButton>
            </div>
          </div>
        );

      case "appearance":
        return (
          <div className="space-y-6 max-w-2xl">
            <h2 className="text-xl font-bold text-white mb-6">Appearance</h2>
            <div className="space-y-8">
              <div className="space-y-4">
                <label className="text-xs font-bold text-muted-foreground uppercase">Theme</label>
                <div className="p-3 bg-black/20 rounded-xl border border-white/5 w-fit">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-slate-800" />
                    <span className="text-sm font-medium text-white">Dark (always)</span>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-xs font-bold text-muted-foreground uppercase">Font Scaling</label>
                <div className="flex gap-2 bg-black/20 p-1 rounded-xl w-fit border border-white/5">
                  <button className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-white">Small</button>
                  <button className="px-4 py-2 rounded-lg text-sm bg-white/10 text-white">Medium</button>
                  <button className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-white">Large</button>
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-xs font-bold text-muted-foreground uppercase">Message Display</label>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white group-hover:text-primary transition-colors">Cozy</div>
                      <div className="text-xs text-muted-foreground">Modern, spacious, and comfortable.</div>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="w-5 h-5 rounded-full border-2 border-white/20 flex items-center justify-center">
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white group-hover:text-primary transition-colors">Compact</div>
                      <div className="text-xs text-muted-foreground">Fit more messages on screen at once.</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        );

      case "voice":
        return (
          <div className="space-y-8 max-w-2xl">
            <h2 className="text-xl font-bold text-white mb-6">Voice & Video</h2>
            
            <div className="space-y-4">
              <label className="text-xs font-bold text-muted-foreground uppercase">Hardware Devices</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <span className="text-sm text-gray-300">Input Device</span>
                  <select className="w-full bg-black/20 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-primary">
                    <option>Default Microphone</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <span className="text-sm text-gray-300">Output Device</span>
                  <select className="w-full bg-black/20 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-primary">
                    <option>Default Speakers</option>
                  </select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <span className="text-sm text-gray-300">Camera</span>
                  <select className="w-full bg-black/20 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-primary">
                    <option>Default Camera</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-6 pt-4 border-t border-white/5">
              <label className="text-xs font-bold text-muted-foreground uppercase">Input Mode</label>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-white">Push to Talk</div>
                  <div className="text-xs text-muted-foreground">Hold SPACE to transmit audio.</div>
                </div>
                <Switch defaultChecked={localStorage.getItem("pushToTalk") === "true"} onCheckedChange={(c) => localStorage.setItem("pushToTalk", c ? "true" : "false")} />
              </div>
              <div className="space-y-3">
                <div className="text-sm text-white">Input Sensitivity</div>
                <Slider defaultValue={[50]} max={100} step={1} className="w-full" />
              </div>
            </div>

            <div className="space-y-6 pt-4 border-t border-white/5">
              <label className="text-xs font-bold text-muted-foreground uppercase">Advanced Processing</label>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-white">Noise Suppression</div>
                  <div className="text-xs text-muted-foreground">Filters out background noise.</div>
                </div>
                <Switch defaultChecked={true} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-white">Echo Cancellation</div>
                  <div className="text-xs text-muted-foreground">Prevents audio feedback.</div>
                </div>
                <Switch defaultChecked={true} />
              </div>
            </div>
          </div>
        );

      case "notifications":
      case "privacy":
        return (
          <div className="space-y-6 max-w-2xl">
            <h2 className="text-xl font-bold text-white mb-6">{activeSection === "notifications" ? "Notifications" : "Privacy & Safety"}</h2>
            <div className="space-y-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-white">Settings toggle {i}</div>
                    <div className="text-xs text-muted-foreground">Description goes here</div>
                  </div>
                  <Switch defaultChecked={true} />
                </div>
              ))}
            </div>
          </div>
        );
      default: return null;
    }
  };

  const NavButton = ({ section, icon: Icon, label, destructive = false }: any) => (
    <button
      onClick={() => destructive ? handleLogout() : handleSectionClick(section)}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        destructive 
          ? "text-red-500 hover:bg-red-500/10" 
          : activeSection === section && !isMobileList
            ? "bg-white/10 text-white" 
            : "text-muted-foreground hover:bg-white/5 hover:text-gray-200"
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );

  return (
    <div className="flex h-[100dvh] w-full bg-background overflow-hidden relative">
      {/* Sidebar Navigation */}
      <div className={`${isMobileList ? 'flex' : 'hidden'} md:flex w-full md:w-60 flex-col bg-sidebar/50 border-r border-white/10 pt-16 md:pt-8 pb-8 px-4 overflow-y-auto`}>
        <div className="md:hidden absolute top-4 right-4 z-50">
          <GlassButton onClick={() => setLocation("/")} className="w-10 h-10 p-0 rounded-full border border-white/10">
            <X className="w-5 h-5 text-white" />
          </GlassButton>
        </div>

        <div className="mb-6 px-3">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">User Settings</h2>
          <div className="space-y-0.5">
            <NavButton section="account" icon={UserCircle} label="My Account" />
            <NavButton section="profile" icon={Palette} label="User Profile" />
          </div>
        </div>

        <div className="mb-6 px-3">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">App Settings</h2>
          <div className="space-y-0.5">
            <NavButton section="appearance" icon={Monitor} label="Appearance" />
            <NavButton section="voice" icon={Mic} label="Voice & Video" />
            <NavButton section="notifications" icon={Bell} label="Notifications" />
            <NavButton section="privacy" icon={Shield} label="Privacy & Safety" />
          </div>
        </div>

        <div className="px-3">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Danger Zone</h2>
          <NavButton section="logout" icon={LogOut} label="Log Out" destructive />
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`${!isMobileList ? 'flex' : 'hidden'} md:flex flex-1 flex-col relative`}>
        <div className="absolute top-4 right-4 z-50 md:top-8 md:right-8 flex items-center gap-4">
          <button className="md:hidden text-muted-foreground hover:text-white p-2" onClick={() => setIsMobileList(true)}>Back</button>
          <GlassButton onClick={() => setLocation("/")} className="w-10 h-10 p-0 rounded-full border border-white/10 hidden md:flex items-center justify-center group hover:bg-white/10 transition-colors">
            <X className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
          </GlassButton>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 md:p-8 pt-16 md:pt-12">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={activeSection} className="max-w-4xl">
            {renderSectionContent()}
          </motion.div>
        </div>
      </div>
    </div>
  );
}