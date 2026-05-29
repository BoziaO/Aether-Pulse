import { Sidebar } from "@/components/layout/sidebar";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useUpdateUser, getGetMeQueryKey } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { LogOut } from "lucide-react";
import { useLogout } from "@workspace/api-client-react";
import { useLocation } from "wouter";

const settingsSchema = z.object({
  displayName: z.string().min(1, "Display name is required").max(32),
  bio: z.string().max(500).optional().nullable(),
  customStatus: z.string().max(100).optional().nullable(),
});

export default function SettingsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const updateUser = useUpdateUser();
  const logout = useLogout();
  const [, setLocation] = useLocation();

  const form = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      displayName: "",
      bio: "",
      customStatus: "",
    },
  });

  const isInitialized = useRef(false);

  useEffect(() => {
    if (user && !isInitialized.current) {
      form.reset({
        displayName: user.displayName,
        bio: user.bio,
        customStatus: user.customStatus,
      });
      isInitialized.current = true;
    }
  }, [user, form]);

  const onSubmit = (values: z.infer<typeof settingsSchema>) => {
    if (!user) return;
    
    // Convert null to undefined for the API
    const data = {
      displayName: values.displayName,
      bio: values.bio || undefined,
      customStatus: values.customStatus || undefined,
    };
    
    updateUser.mutate({ userId: user.id, data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
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

  if (!user) return null;

  return (
    <div className="flex h-[100dvh] w-full bg-background overflow-hidden relative">
      <Sidebar />
      
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-8 pt-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">Settings</h1>
                <p className="text-muted-foreground mt-1">Manage your AetherPulse profile</p>
              </div>
              <GlassButton variant="destructive" onClick={handleLogout} className="gap-2">
                <LogOut className="w-4 h-4" /> Disconnect
              </GlassButton>
            </div>

            <GlassCard className="p-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="displayName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">Display Name</FormLabel>
                        <FormControl>
                          <Input className="bg-black/20 border-white/10 text-white focus-visible:ring-primary" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="customStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">Custom Status</FormLabel>
                        <FormControl>
                          <Input placeholder="What's on your mind?" className="bg-black/20 border-white/10 text-white focus-visible:ring-primary" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">Biography</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Tell others about yourself..." 
                            className="bg-black/20 border-white/10 text-white focus-visible:ring-primary min-h-[120px] resize-none" 
                            {...field} 
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="pt-4 flex justify-end">
                    <GlassButton variant="primary" type="submit" disabled={updateUser.isPending} className="px-8">
                      {updateUser.isPending ? "Saving..." : "Save Changes"}
                    </GlassButton>
                  </div>
                </form>
              </Form>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
