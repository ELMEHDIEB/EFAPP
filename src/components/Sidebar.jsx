import { NavLink } from "react-router-dom";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { to: "/bilan-tracker", label: "Bilan & Tracker", icon: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
  { to: "/accounts", label: "Comptes", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" },
  { to: "/analytics", label: "Analytics", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
  { type: "divider", label: "Gamification" },
  { to: "/achievements", label: "Achievements", icon: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" },
  { to: "/leaderboard", label: "Leaderboard", icon: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" },
  { type: "divider", label: "Mental Coach" },
  { to: "/spin-tracker", label: "Spin Tracker", icon: "M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" },
  { to: "/journal", label: "Journal Émotionnel", icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" },
  { type: "divider" },
  { to: "/settings", label: "Paramètres", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" },
];

export default function Sidebar() {
  return (
    <nav className="w-64 shrink-0 bg-ink border-r border-border flex flex-col h-full justify-between">
      <div className="pt-8 px-4">
        <div className="px-2 mb-10 flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-white flex items-center justify-center">
            <svg className="w-5 h-5 text-ink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-white tracking-wide">EFAPP</p>
            <p className="text-[10px] text-textdim uppercase tracking-widest font-medium">Coin Manager Pro</p>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          {NAV_ITEMS.map((item, index) => {
            if (item.type === "divider") {
              return (
                <div key={`div-${index}`} className="my-2 px-3">
                  {item.label && <p className="text-[10px] font-bold text-textdim uppercase tracking-widest mb-2">{item.label}</p>}
                  <div className="h-px w-full bg-border" />
                </div>
              );
            }
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 outline-none focus-visible:ring-1 focus-visible:ring-white " +
                  (isActive
                    ? "bg-panel2 text-white"
                    : "text-textdim hover:text-white hover:bg-panel")
                }
              >
                {({ isActive }) => (
                  <>
                    <svg className={`w-[18px] h-[18px] ${isActive ? 'text-white' : 'text-textdim'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                      {item.label === "Settings" && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />}
                    </svg>
                    {item.label}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </div>

      <div className="px-6 py-8 border-t border-border mt-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-textdim">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="text-xs font-medium">Recherche</span>
          </div>
          <kbd className="px-2 py-1 text-[10px] font-mono text-textdim bg-white/5 rounded border border-white/10 uppercase tracking-widest">Ctrl K</kbd>
        </div>
        <p className="text-[10px] text-textdim uppercase tracking-widest mb-1">Created by</p>
        <p className="text-xs font-semibold text-white tracking-wide mb-3">EL MEHDI MTM</p>
        <div className="inline-flex items-center px-2 py-1 rounded bg-panel2 border border-border">
          <p className="text-[10px] text-textdim font-mono tracking-wider">v1.1 UI Pro Max</p>
        </div>
      </div>
    </nav>
  );
}
