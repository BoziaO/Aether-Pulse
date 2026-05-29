import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AuthProvider } from "@/hooks/use-auth";
import AuthPage from "@/pages/auth";
import HomePage from "@/pages/home";
import RoomPage from "@/pages/room";
import JoinRoomPage from "@/pages/join-room";
import ProfilePage from "@/pages/profile";
import SettingsPage from "@/pages/settings";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Switch>
              <Route path="/auth" component={AuthPage} />
              <Route path="/room/:roomId/join" component={JoinRoomPage} />
              <Route path="/room/:roomId" component={RoomPage} />
              <Route path="/profile/:userId" component={ProfilePage} />
              <Route path="/settings" component={SettingsPage} />
              <Route path="/" component={HomePage} />
              <Route component={NotFound} />
            </Switch>
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;