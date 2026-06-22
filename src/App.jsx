import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "./db.js";

import Sidebar from "./components/Sidebar.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Accounts from "./pages/Accounts.jsx";
import SpinTracker from "./pages/SpinTracker.jsx";
import EmotionalJournal from "./pages/EmotionalJournal.jsx";
import Analytics from "./pages/Analytics.jsx";
import Settings from "./pages/Settings.jsx";
import PinLock from "./pages/PinLock.jsx";
import PostLossRecovery from "./pages/PostLossRecovery.jsx";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const settings = useLiveQuery(() => db.settings.toArray(), []);

  if (!settings) return null; // Wait for IndexedDB

  const pinSetting = settings.find(s => s.key === "pinLock");

  if (pinSetting && pinSetting.value && !isAuthenticated) {
    return <PinLock expectedPin={pinSetting.value} onSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/accounts" element={<Accounts />} />
          <Route path="/spin-tracker" element={<SpinTracker />} />
          <Route path="/journal" element={<EmotionalJournal />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/post-loss-recovery" element={<PostLossRecovery />} />
        </Routes>
      </main>
    </div>
  );
}
