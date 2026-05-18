import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import DashboardHome from "./pages/dashboard/DashboardHome";
import DashboardIntake from "./pages/dashboard/DashboardIntake";
import DashboardRadar from "./pages/dashboard/DashboardRadar";
import DashboardHealth from "./pages/dashboard/DashboardHealth";
import DashboardFunnels from "./pages/dashboard/DashboardFunnels";
import DashboardSortingHat from "./pages/dashboard/DashboardSortingHat";
import DashboardSettings from "./pages/dashboard/DashboardSettings";
import DashboardConstellation from "./pages/dashboard/DashboardConstellation";
import DashboardExchange from "./pages/dashboard/DashboardExchange";
import DashboardEditing from "./pages/dashboard/DashboardEditing";
import DashboardComingOnline from "./pages/dashboard/DashboardComingOnline";
import DashboardCanon from "./pages/dashboard/DashboardCanon";
import DashboardEvents from "./pages/dashboard/DashboardEvents";
import DashboardSwitchboard from "./pages/dashboard/DashboardSwitchboard";
import ArchitectDashboard from "./pages/ArchitectDashboard";
import ArchitectLogin from "./pages/ArchitectLogin";
import ResetPassword from "./pages/ResetPassword";
import Nexus from "./pages/Nexus";
import Canon from "./pages/Canon";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<Dashboard />}>
            <Route index element={<DashboardHome />} />
            <Route path="intake" element={<DashboardIntake />} />
            <Route path="radar" element={<DashboardRadar />} />
            <Route path="health" element={<DashboardHealth />} />
            <Route path="funnels" element={<DashboardFunnels />} />
            <Route path="sorting-hat" element={<DashboardSortingHat />} />
            <Route path="settings" element={<DashboardSettings />} />
            <Route path="constellation" element={<DashboardConstellation />} />
            <Route path="exchange" element={<DashboardExchange />} />
            <Route path="editing" element={<DashboardEditing />} />
            <Route path="canon" element={<DashboardCanon />} />
            <Route path="events" element={<DashboardEvents />} />
            <Route path="switchboard" element={<DashboardSwitchboard />} />
            <Route path="mode/:mode" element={<DashboardComingOnline />} />
          </Route>
          <Route path="/nexus" element={<Nexus />} />
          <Route path="/canon" element={<Canon />} />
          <Route path="/architect-dashboard" element={<ArchitectDashboard />} />
          <Route path="/architect-login" element={<ArchitectLogin />} />
          <Route path="/auth/reset-password" element={<ResetPassword />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
