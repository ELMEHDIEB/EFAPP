import { useState, useEffect, Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "./db.js";

import { ToastProvider } from "./components/ui/ToastContext.jsx";
import { useToast } from "./hooks/useToast.js";
import { ConfirmProvider } from "./components/ui/ConfirmContext.jsx";

function GlobalListeners() {
  const toast = useToast();
  
  useEffect(() => {
    const handleMilestone = (e) => {
      const { tier, coins } = e.detail;
      toast(`🎉 Palier atteint ! Vous avez franchi la barre des ${tier} coins (Solde actuel : ${coins}).`, "success");
    };
    window.addEventListener('milestone_passed', handleMilestone);
    return () => window.removeEventListener('milestone_passed', handleMilestone);
  }, [toast]);
  
  return null;
}

import Sidebar from "./components/Sidebar.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Accounts from "./pages/Accounts.jsx";
import Settings from "./pages/Settings.jsx";
import PinLock from "./pages/PinLock.jsx";

// Lazy Loaded Components to optimize bundle size
const CommandPalette = lazy(() => import("./components/ui/CommandPalette.jsx").then(m => ({ default: m.CommandPalette })));
const NotFound = lazy(() => import("./pages/NotFound.jsx"));

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const settings = useLiveQuery(() => db.settings.toArray(), []);

  const pinSetting = settings?.find(s => s.key === "pinLock");
  const autoLockSetting = settings?.find(s => s.key === "autoLockMinutes");

  useEffect(() => {
    if (!isAuthenticated || !pinSetting?.value) return;
    const minutes = parseInt(autoLockSetting?.value || "0", 10);
    if (minutes <= 0) return;
    
    let timeout;
    const resetTimer = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        setIsAuthenticated(false);
      }, minutes * 60000);
    };
    
    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("keydown", resetTimer);
    window.addEventListener("click", resetTimer);
    resetTimer();
    
    return () => {
      clearTimeout(timeout);
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("keydown", resetTimer);
      window.removeEventListener("click", resetTimer);
    };
  }, [isAuthenticated, pinSetting, autoLockSetting]);

  if (!settings) return null; // Wait for IndexedDB

  if (pinSetting && pinSetting.value && !isAuthenticated) {
    return <PinLock expectedPin={pinSetting.value} onSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <ToastProvider>
      <ConfirmProvider>
        <GlobalListeners />
        <div className="flex h-screen bg-ink overflow-hidden selection:bg-white/20">
          <Sidebar />
          <Suspense fallback={null}>
            <CommandPalette />
          </Suspense>
          <main className="flex-1 overflow-y-auto p-4 md:p-8">
            <ErrorBoundary>
              <Suspense fallback={<div className="flex h-[70vh] items-center justify-center"><div className="w-8 h-8 border-2 border-white/10 border-t-white rounded-full animate-spin"></div></div>}>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/accounts" element={<Accounts />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </main>
        </div>
      </ConfirmProvider>
    </ToastProvider>
  );
}
