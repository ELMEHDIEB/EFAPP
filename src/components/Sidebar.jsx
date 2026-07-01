import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { tokens } from "../styles/designTokens";

const NAV_GROUPS = [
  {
    label: "CORE",
    items: [
      { to: "/", label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
      { to: "/accounts", label: "Comptes", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" },
      { to: "/bilan-tracker", label: "Bilan", icon: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
    ]
  },
  {
    label: "ANALYTICS",
    items: [
      { to: "/analytics", label: "Analytics", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
      { to: "/leaderboard", label: "Leaderboard", icon: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" },
      { to: "/achievements", label: "Achievements", icon: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" },
      { to: "/journal", label: "Journal Émotionnel", icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" },
    ]
  },
  {
    label: "TOOLS",
    items: [
      { to: "/squad-builder", label: "Squad Builder", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" },
      { to: "/spin-tracker", label: "Spin Tracker", icon: "M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" },
      { to: "/players", label: "Database Joueurs", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" },
      { to: "/epic-calculator", label: "Epic Calculator", icon: "M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" },
      { to: "/simulator", label: "Simulateur Box", icon: "M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" },
      { to: "/live-packs", label: "Live Packs", icon: "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
    ]
  },
  {
    label: "SYSTEM",
    items: [
      { to: "/settings", label: "Settings", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" },
      { to: "/settings/data-management", label: "Data Management", icon: "M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" },
      { to: "/sync", label: "Sync Center", icon: "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" },
    ]
  }
];

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const openCommandPalette = () => {
    window.dispatchEvent(new Event("open-command-palette"));
  };

  const sidebarContent = (
    <div className="flex flex-col h-full pt-6 px-4">
      {/* Floating Logo Card */}
      <div className={`mb-8 shrink-0 flex items-center ${isCollapsed ? 'justify-center p-2' : 'gap-3 p-3'} bg-surface border border-border ${tokens.radius.lg} ${tokens.shadows.card}`}>
        <img src="/EFAPP-LOGO.ico" alt="EFAPP Logo" className="w-12 h-12 rounded shrink-0 object-contain" />
        {!isCollapsed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 overflow-hidden whitespace-nowrap flex flex-col justify-center">
            <p className="text-sm font-bold text-white tracking-wide">EFAPP</p>
          </motion.div>
        )}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)} 
          className="hidden md:flex text-textdim hover:text-white p-1 rounded hover:bg-surfaceInteractive shrink-0 ml-auto"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isCollapsed ? "M13 5l7 7-7 7M5 5l7 7-7 7" : "M11 19l-7-7 7-7m8 14l-7-7 7-7"} />
          </svg>
        </button>
      </div>

      {/* Command Search Card */}
      <div 
        onClick={openCommandPalette}
        className={`mb-6 shrink-0 flex items-center ${isCollapsed ? 'justify-center p-2' : 'justify-between p-2.5'} bg-surfaceElevated border border-border cursor-pointer hover:border-textdim/50 ${tokens.radius.md} ${tokens.animations.normal}`}
      >
        <div className="flex items-center gap-2 text-textdim overflow-hidden">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {!isCollapsed && <span className="text-xs font-medium whitespace-nowrap">Search...</span>}
        </div>
        {!isCollapsed && <kbd className="px-2 py-1 text-[10px] font-mono text-textdim bg-surfaceInteractive rounded border border-border uppercase tracking-widest">Ctrl K</kbd>}
      </div>

      <div className="flex flex-col gap-6 overflow-y-auto flex-1 pb-6 pr-1 custom-scrollbar">
        {NAV_GROUPS.map((group, gIdx) => (
          <div key={gIdx} className="flex flex-col gap-1">
            {!isCollapsed && (
              <p className={`${tokens.typography.caption} text-textmuted mb-2 px-3`}>{group.label}</p>
            )}
            {isCollapsed && <div className="h-px w-full bg-border my-2" />}
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                onClick={() => setIsMobileOpen(false)}
                className={({ isActive }) =>
                  `relative flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2 ${tokens.radius.md} text-sm font-medium ${tokens.animations.fast} outline-none focus-visible:ring-1 focus-visible:ring-white group ` +
                  (isActive
                    ? "text-white bg-surfaceElevated shadow-sm"
                    : "text-textdim hover:text-white hover:bg-surfaceInteractive")
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.div 
                        layoutId="activeNav"
                        className={`absolute left-0 top-[20%] bottom-[20%] w-1 bg-white rounded-r-md`}
                      />
                    )}
                    <svg className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-textdim group-hover:text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                    </svg>
                    {!isCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Toggle */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button 
          onClick={() => setIsMobileOpen(true)}
          className="p-2 bg-surfaceElevated border border-border rounded-lg text-white"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Desktop Sidebar */}
      <motion.nav 
        animate={{ width: isCollapsed ? 80 : 256 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="hidden md:flex shrink-0 bg-background border-r border-border h-full flex-col overflow-hidden"
      >
        {sidebarContent}
      </motion.nav>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-ink/80 backdrop-blur-sm md:hidden"
              onClick={() => setIsMobileOpen(false)}
            />
            <motion.nav 
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-64 bg-background border-r border-border z-[101] md:hidden"
            >
              {sidebarContent}
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
