import { Redirect, Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import GalleryPage from "@/pages/Gallery";
import JournalPage from "@/pages/Journal";
import Dashboard from "@/pages/Dashboard";
import CoursePage from "@/pages/Course";
import LeaderboardPage from "@/pages/Leaderboard";
import TradingAccountsPage from "@/pages/TradingAccounts";
import AdminPage from "@/pages/Admin";
import AdminMemberJournalPage from "@/pages/AdminMemberJournal";
import { ForgotPasswordPage, LoginPage, PendingPage, ResetPasswordPage, SignupPage } from "@/pages/Auth";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute, PublicOnlyRoute } from "@/components/member/RouteGuards";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/gallery" component={GalleryPage} />
      <Route path="/login"><PublicOnlyRoute><LoginPage /></PublicOnlyRoute></Route>
      <Route path="/signup"><PublicOnlyRoute><SignupPage /></PublicOnlyRoute></Route>
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/reset-password" component={ResetPasswordPage} />
      <Route path="/pending"><PendingPage /></Route>
      <Route path="/rejected"><PendingPage status="rejected" /></Route>
      <Route path="/suspended"><PendingPage status="suspended" /></Route>
      <Route path="/dashboard"><ProtectedRoute><Dashboard /></ProtectedRoute></Route>
      <Route path="/dashboard/course"><ProtectedRoute><CoursePage /></ProtectedRoute></Route>
      <Route path="/dashboard/accounts"><ProtectedRoute><TradingAccountsPage /></ProtectedRoute></Route>
      <Route path="/dashboard/leaderboard"><ProtectedRoute admin><LeaderboardPage /></ProtectedRoute></Route>
      <Route path="/dashboard/journal"><ProtectedRoute><JournalPage /></ProtectedRoute></Route>
      <Route path="/dashboard/education"><Redirect to="/dashboard/course" /></Route>
      <Route path="/dashboard/analytics"><Redirect to="/dashboard" /></Route>
      <Route path="/dashboard/calendar"><Redirect to="/dashboard" /></Route>
      <Route path="/dashboard/chat"><Redirect to="/dashboard" /></Route>
      <Route path="/dashboard/settings"><Redirect to="/dashboard" /></Route>
      <Route path="/dashboard/help"><Redirect to="/dashboard" /></Route>
      <Route path="/admin"><Redirect to="/admin/members" /></Route>
      <Route path="/admin/members"><ProtectedRoute admin><AdminPage /></ProtectedRoute></Route>
      <Route path="/admin/members/:memberId/journal"><ProtectedRoute admin><AdminMemberJournalPage /></ProtectedRoute></Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AuthProvider><Router /></AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
