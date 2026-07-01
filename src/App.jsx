import { useState, Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "./db";

import { ToastProvider } from "./components/ui/ToastContext.jsx";
import { ConfirmProvider } from "./components/ui/ConfirmContext.jsx";

import TopNavigation from "./components/TopNavigation.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import PinLock from "./pages/PinLock.jsx";
import DashboardSkeleton from "./components/ui/DashboardSkeleton.jsx";

// Lazy Loaded Components to optimize bundle size
const Dashboard = lazy(() => import("./pages/Dashboard.jsx"));
const Accounts = lazy(() => import("./pages/Accounts.jsx"));
const SpinTracker = lazy(() => import("./pages/SpinTracker.jsx"));
const EmotionalJournal = lazy(() => import("./pages/EmotionalJournal.jsx"));
const Settings = lazy(() => import("./pages/Settings.jsx"));
const PostLossRecovery = lazy(() => import("./pages/PostLossRecovery.jsx"));
const Analytics = lazy(() => import("./pages/Analytics.jsx"));
const BilanTracker = lazy(() => import("./pages/BilanTracker.jsx"));
const CommandPalette = lazy(() => import("./components/ui/CommandPalette.jsx").then(m => ({ default: m.CommandPalette })));
const Achievements = lazy(() => import("./pages/Achievements.jsx"));
const Leaderboard = lazy(() => import("./pages/Leaderboard.jsx"));
const DataManagement = lazy(() => import("./pages/DataManagement.jsx"));
const EpicCalculator = lazy(() => import("./pages/EpicCalculator.jsx"));
const LivePacks = lazy(() => import("./pages/LivePacks.jsx"));
const PackAnalysis = lazy(() => import("./pages/PackAnalysis.jsx"));
const SyncCenter = lazy(() => import("./pages/SyncCenter.jsx"));
const PlayerDatabase = lazy(() => import("./pages/PlayerDatabase.jsx"));
const GachaSimulator = lazy(() => import("./pages/GachaSimulator.jsx"));
const SquadBuilder = lazy(() => import("./pages/SquadBuilder.jsx"));

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const settings = useLiveQuery(() => db.settings.toArray(), []);

  // Show a structural skeleton instead of blocking the whole UI with a blank screen
  if (!settings) {
    return (
      <div className="flex flex-col h-screen bg-ink overflow-hidden selection:bg-white/20">
        <TopNavigation />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
          <DashboardSkeleton />
        </main>
      </div>
    );
  }

  const pinSetting = settings.find(s => s.key === "pinLock");

  if (pinSetting && pinSetting.value && !isAuthenticated) {
    return <PinLock expectedPin={pinSetting.value} onSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <ToastProvider>
      <ConfirmProvider>
        <div className="flex flex-col h-screen bg-ink overflow-hidden selection:bg-white/20">
          <TopNavigation />
          <Suspense fallback={null}>
            <CommandPalette />
          </Suspense>
          <main className="flex-1 overflow-y-auto p-4 md:p-8">
            <Suspense fallback={<DashboardSkeleton />}>
              <ErrorBoundary>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/bilan-tracker" element={<BilanTracker />} />
                  <Route path="/accounts" element={<Accounts />} />
                  <Route path="/squad-builder" element={<SquadBuilder />} />
                  <Route path="/spin-tracker" element={<SpinTracker />} />
                  <Route path="/players" element={<PlayerDatabase />} />
                  <Route path="/journal" element={<EmotionalJournal />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/achievements" element={<Achievements />} />
                  <Route path="/leaderboard" element={<Leaderboard />} />
                  <Route path="/epic-calculator" element={<EpicCalculator />} />
                  <Route path="/simulator" element={<GachaSimulator />} />
                  <Route path="/live-packs" element={<LivePacks />} />
                  <Route path="/live-packs/analyze" element={<PackAnalysis />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/settings/data-management" element={<DataManagement />} />
                  <Route path="/sync" element={<SyncCenter />} />
                  <Route path="/post-loss-recovery" element={<PostLossRecovery />} />
                </Routes>
              </ErrorBoundary>
            </Suspense>
          </main>
        </div>
      </ConfirmProvider>
    </ToastProvider>
  );
}
