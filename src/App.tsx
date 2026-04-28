import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AuthProvider } from "@/contexts/AuthContext";
import SupportChat from "@/components/SupportChat";
import Index from "./pages/Index";
import Products from "./pages/Products";
import Recommendation from "./pages/Recommendation";
import About from "./pages/About";
import NotFound from "./pages/NotFound";
import Install from "./pages/Install";
import Auth from "./pages/Auth";
import History from "./pages/History";
import Profile from "./pages/Profile";
import Orders from "./pages/Orders";
import AdminSupport from "./pages/AdminSupport";
import AdminSupportRoom from "./pages/AdminSupportRoom";

const queryClient = new QueryClient();

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Index />} />
        <Route path="/products" element={<Products />} />
        <Route path="/recommendation" element={<Recommendation />} />
        <Route path="/about" element={<About />} />
        <Route path="/install" element={<Install />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/history" element={<History />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/admin/support" element={<AdminSupport />} />
        <Route path="/admin/support/:roomId" element={<AdminSupportRoom />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AnimatedRoutes />
          <SupportChat />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
