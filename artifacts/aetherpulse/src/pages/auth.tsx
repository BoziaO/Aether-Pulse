import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLogin, useRegister, getGetMeQueryKey } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(20),
  password: z.string().min(6, "Password must be at least 6 characters"),
  displayName: z.string().min(1, "Display name is required").max(32),
});

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const loginMutation = useLogin();
  const registerMutation = useRegister();

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: "", password: "", displayName: "" },
  });

  const onLogin = (values: z.infer<typeof loginSchema>) => {
    loginMutation.mutate({ data: values }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        setLocation("/");
      }
    });
  };

  const onRegister = (values: z.infer<typeof registerSchema>) => {
    registerMutation.mutate({ data: values }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        setLocation("/");
      }
    });
  };

  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center bg-background relative overflow-hidden">
      {/* Background ambient glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-accent/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center mb-8"
        >
          <img src="/logo.png" alt="AetherPulse" className="w-24 h-24 object-contain mb-2 drop-shadow-[0_0_24px_rgba(124,58,237,0.6)]" />
          <h1 className="text-3xl font-bold text-white tracking-tight">AetherPulse</h1>
          <p className="text-muted-foreground mt-2 text-center">Your private digital space</p>
        </motion.div>

        <GlassCard className="p-8">
          <div className="flex space-x-1 bg-black/20 p-1 rounded-xl mb-8">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${isLogin ? 'bg-white/10 text-white shadow-sm' : 'text-muted-foreground hover:text-white'}`}
            >
              Log In
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${!isLogin ? 'bg-white/10 text-white shadow-sm' : 'text-muted-foreground hover:text-white'}`}
            >
              Register
            </button>
          </div>

          <AnimatePresence mode="wait">
            {isLogin ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-300">Username</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your username" className="bg-black/20 border-white/10 text-white focus-visible:ring-primary focus-visible:border-primary" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-300">Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Enter your password" className="bg-black/20 border-white/10 text-white focus-visible:ring-primary focus-visible:border-primary" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <GlassButton variant="primary" type="submit" className="w-full mt-6 py-6 text-base font-semibold" disabled={loginMutation.isPending}>
                      {loginMutation.isPending ? "Connecting..." : "Enter Workspace"}
                    </GlassButton>
                  </form>
                </Form>
              </motion.div>
            ) : (
              <motion.div
                key="register"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="displayName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-300">Display Name</FormLabel>
                          <FormControl>
                            <Input placeholder="How should we call you?" className="bg-black/20 border-white/10 text-white focus-visible:ring-primary focus-visible:border-primary" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-300">Username</FormLabel>
                          <FormControl>
                            <Input placeholder="Choose a username" className="bg-black/20 border-white/10 text-white focus-visible:ring-primary focus-visible:border-primary" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-300">Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Create a strong password" className="bg-black/20 border-white/10 text-white focus-visible:ring-primary focus-visible:border-primary" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <GlassButton variant="primary" type="submit" className="w-full mt-6 py-6 text-base font-semibold" disabled={registerMutation.isPending}>
                      {registerMutation.isPending ? "Creating Space..." : "Initialize Profile"}
                    </GlassButton>
                  </form>
                </Form>
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>
      </div>
    </div>
  );
}
