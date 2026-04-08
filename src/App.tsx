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
import ArchitectDashboard from "./pages/ArchitectDashboard";
import ArchitectLogin from "./pages/ArchitectLogin";

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
          </Route>
          <Route path="/architect-dashboard" element={<ArchitectDashboard />} />
          <Route path="/architect-login" element={<ArchitectLogin />} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
