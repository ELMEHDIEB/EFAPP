import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db.js";
import { SpinHistory } from "../components/spin/SpinHistory.jsx";
import { SpinWizard } from "../components/spin/SpinWizard.jsx";

export default function SpinTracker() {
  const accounts = useLiveQuery(() => db.accounts.orderBy("name").toArray(), []);
  const spinLogs = useLiveQuery(() => db.spinLogs.reverse().toArray(), []);

  const [view, setView] = useState({ name: "history", isPast: false }); // 'history' | 'wizard'

  if (!accounts || !spinLogs) return <p className="text-textdim">Chargement…</p>;

  if (view.name === "history") {
    return (
      <SpinHistory 
        logs={spinLogs} 
        accounts={accounts} 
        onNewSpin={(isPast) => setView({ name: "wizard", isPast })} 
      />
    );
  }

  return (
    <SpinWizard 
      accounts={accounts}
      isPast={view.isPast}
      onComplete={() => setView({ name: "history", isPast: false })} 
      onCancel={() => setView({ name: "history", isPast: false })} 
    />
  );
}
