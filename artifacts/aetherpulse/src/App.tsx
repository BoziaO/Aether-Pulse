import { lazy, Suspense } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";

const NotFound = lazy(() => import("@/pages/not-found"));
const AuthPage = lazy(() => import("@/pages/auth"));
const HomePage = lazy(() => import("@/pages/home"));
const RoomPage = lazy(() => import("@/pages/room"));
const JoinRoomPage = lazy(() => import("@/pages/join-room"));
const ProfilePage = lazy(() => import("@/pages/profile"));
const SettingsPage = lazy(() => import("@/pages/settings"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30 seconds
      gcTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Suspense fallback={<div className="h-screen w-screen flex items-center justify-center bg-background"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" /></div>}>
              <Switch>
                <Route path="/auth" component={AuthPage} />
                <Route path="/join" component={JoinRoomPage} />
                <Route path="/room/:roomId/join" component={JoinRoomPage} />
                <Route path="/room/:roomId" component={RoomPage} />
                <Route path="/profile/:userId" component={ProfilePage} />
                <Route path="/settings" component={SettingsPage} />
                <Route path="/" component={HomePage} />
                <Route component={NotFound} />
              </Switch>
            </Suspense>
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;