import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import CreateApplication from "./pages/CreateApplication";
import ApplicationView from "./pages/ApplicationView";
import EvaluationPage from "./pages/EvaluationPage";
import AdminPage from "./pages/AdminPage";
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
          <Route path="/create-application" element={<CreateApplication />} />
          <Route path="/application/:token" element={<ApplicationView />} />
          <Route path="/evaluation/:applicationId" element={<EvaluationPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/admin-dashboard" element={<AdminPage />} />
          <Route path="/admin-login" element={<AdminPage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
