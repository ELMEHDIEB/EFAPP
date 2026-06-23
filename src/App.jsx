import { useState, Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "./db.js";

import { ToastProvider } from "./components/ui/ToastContext.jsx";
import { ConfirmProvider } from "./components/ui/ConfirmContext.jsx";

import Sidebar from "./components/Sidebar.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Accounts from "./pages/Accounts.jsx";
import SpinTracker from "./pages/SpinTracker.jsx";
import EmotionalJournal from "./pages/EmotionalJournal.jsx";
import Settings from "./pages/Settings.jsx";
import PinLock from "./pages/PinLock.jsx";
import PostLossRecovery from "./pages/PostLossRecovery.jsx";

// Lazy Loaded Components to optimize bundle size
const Analytics = lazy(() => import("./pages/Analytics.jsx"));
const BilanTracker = lazy(() => import("./pages/BilanTracker.jsx"));
const CommandPalette = lazy(() => import("./components/ui/CommandPalette.jsx").then(m => ({ default: m.CommandPalette })));
const Achievements = lazy(() => import("./pages/Achievements.jsx"));
const Leaderboard = lazy(() => import("./pages/Leaderboard.jsx"));

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const settings = useLiveQuery(() => db.settings.toArray(), []);

  if (!settings) return null; // Wait for IndexedDB

  const pinSetting = settings.find(s => s.key === "pinLock");

  if (pinSetting && pinSetting.value && !isAuthenticated) {
    return <PinLock expectedPin={pinSetting.value} onSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <ToastProvider>
      <ConfirmProvider>
        <div className="flex h-screen bg-ink overflow-hidden selection:bg-white/20">
          <Sidebar />
          <Suspense fallback={null}>
            <CommandPalette />
          </Suspense>
          <main className="flex-1 overflow-y-auto p-4 md:p-8">
            <Suspense fallback={<div className="flex h-[70vh] items-center justify-center"><div className="w-8 h-8 border-2 border-white/10 border-t-white rounded-full animate-spin"></div></div>}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/bilan-tracker" element={<BilanTracker />} />
                <Route path="/accounts" element={<Accounts />} />
                <Route path="/spin-tracker" element={<SpinTracker />} />
                <Route path="/journal" element={<EmotionalJournal />} />
                <Route path="/analytics" element={<ErrorBoundary><Analytics /></ErrorBoundary>} />
                <Route path="/achievements" element={<Achievements />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/post-loss-recovery" element={<PostLossRecovery />} />
              </Routes>
            </Suspense>
          </main>
        </div>
      </ConfirmProvider>
    </ToastProvider>
  );
}
