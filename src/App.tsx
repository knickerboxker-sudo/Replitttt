import { useEffect, useState } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BottomNav, AppHeader } from "@/components/layout/BottomNav";
import HomePage from "@/pages/HomePage";
import MyBrandsPage from "@/pages/MyBrandsPage";
import VehiclesPage from "@/pages/VehiclesPage";
import ProductsPage from "@/pages/ProductsPage";
import SearchPage from "@/pages/SearchPage";
import TermsPage from "@/pages/TermsPage";
import PrivacyPage from "@/pages/PrivacyPage";
import NotFound from "@/pages/not-found";
import { TermsAcceptanceFlow } from "@/components/legal/TermsAcceptanceFlow";

function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed top-14 left-0 right-0 z-40 bg-orange-500/90 backdrop-blur-sm py-2 px-4 text-center text-sm text-white font-medium">
      Offline: Limited mode - some features unavailable
    </div>
  );
}

function AppContent() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(console.error);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <OfflineBanner />
      <TermsAcceptanceFlow />
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/my-brands" component={MyBrandsPage} />
        <Route path="/vehicles" component={VehiclesPage} />
        <Route path="/products" component={ProductsPage} />
        <Route path="/search" component={SearchPage} />
        <Route path="/terms" component={TermsPage} />
        <Route path="/privacy" component={PrivacyPage} />
        <Route component={NotFound} />
      </Switch>
      <BottomNav />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AppContent />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
