import React, { useState, useEffect } from "react";
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
      { to: "/activity-timeline", label: "Activity Timeline", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
      { to: "/leaderboard", label: "Leaderboard", icon: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" },
      { to: "/achievements", label: "Achievements", icon: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" },
    ]
  },
  {
    label: "TOOLS",
    items: [
      { to: "/spin-tracker", label: "Spin Tracker", icon: "M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" },
      { to: "/epic-calculator", label: "Epic Calculator", icon: "M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" },
    ]
  },
  {
    label: "SYSTEM",
    items: [
      { to: "/settings", label: "Settings", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" },
      { to: "/data-management", label: "Data Management", icon: "M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" },
    ]
  }
];

export default function Sidebar() {
  // Persist collapse state in localStorage (UI preference only)
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem("sidebarCollapsed") === "true";
  });
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", isCollapsed);
  }, [isCollapsed]);

  // Close mobile drawer on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isMobileOpen) {
        setIsMobileOpen(false);
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isMobileOpen]);

  const openCommandPalette = () => {
    window.dispatchEvent(new Event("open-command-palette"));
  };

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between">
      <div className="pt-6 px-4">
        {/* Floating Logo Card */}
        <div className={`mb-8 flex items-center gap-3 bg-surface border border-border p-3 ${tokens.radius.lg} ${tokens.shadows.card}`}>
          <div className="w-8 h-8 rounded bg-white flex shrink-0 items-center justify-center">
            <svg className="w-5 h-5 text-ink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          {!isCollapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 overflow-hidden whitespace-nowrap">
              <p className="text-sm font-black tracking-widest text-white">EFAPP <span className="text-[10px] text-accent ml-1 font-bold">V5.4</span></p>
            </motion.div>
          )}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)} 
            className="hidden md:flex text-textdim hover:text-white p-1 rounded hover:bg-surfaceInteractive shrink-0 ml-auto"
            tabIndex={0}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isCollapsed ? "M13 5l7 7-7 7M5 5l7 7-7 7" : "M11 19l-7-7 7-7m8 14l-7-7 7-7"} />
            </svg>
          </button>
        </div>

        {/* Command Search Card */}
        <div 
          onClick={openCommandPalette}
          className={`mb-6 flex items-center justify-between p-2.5 bg-surfaceElevated border border-border cursor-pointer hover:border-textdim/50 ${tokens.radius.md} ${tokens.animations.normal}`}
          role="button"
          tabIndex={0}
          aria-label="Open command palette"
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openCommandPalette(); } }}
        >
          <div className="flex items-center gap-2 text-textdim overflow-hidden">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {!isCollapsed && <span className="text-xs font-medium whitespace-nowrap">Search...</span>}
          </div>
          {!isCollapsed && <kbd className="px-2 py-1 text-[10px] font-mono text-textdim bg-surfaceInteractive rounded border border-border uppercase tracking-widest">Ctrl K</kbd>}
        </div>

        <div className="flex flex-col gap-6 overflow-y-auto pb-4">
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
                    `relative flex items-center gap-3 px-3 py-2 ${tokens.radius.md} text-sm font-medium ${tokens.animations.fast} outline-none focus-visible:ring-1 focus-visible:ring-white group ` +
                    (isActive
                      ? "text-white bg-surfaceElevated"
                      : "text-textdim hover:text-white hover:bg-surfaceInteractive")
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <motion.div 
                          layoutId="activeNav"
                          className={`absolute left-0 top-0 bottom-0 w-1 bg-white ${tokens.radius.full}`}
                        />
                      )}
                      <svg className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-textdim group-hover:text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={item.icon} />
                      </svg>
                      {!isCollapsed && <span className="whitespace-nowrap ml-1 font-semibold tracking-wide">{item.label}</span>}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Toggle — always visible on small screens */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button 
          onClick={() => setIsMobileOpen(true)}
          className="p-2 bg-surfaceElevated border border-border rounded-lg text-white"
          tabIndex={0}
          aria-label="Open navigation drawer"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Desktop & Tablet Sidebar */}
      <nav 
        className={`hidden md:flex shrink-0 bg-background border-r border-border h-full flex-col overflow-hidden transition-[width] duration-300 ease-in-out ${
          isCollapsed ? "w-[80px] lg:w-[90px]" : "w-[240px] lg:w-[280px]"
        }`}
        role="navigation"
        aria-label="Main navigation"
      >
        {sidebarContent}
      </nav>

      {/* Floating Expand Button — visible only when sidebar is collapsed on desktop */}
      <AnimatePresence>
        {isCollapsed && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsCollapsed(false)}
            className="hidden md:flex fixed bottom-6 left-6 z-[60] w-10 h-10 items-center justify-center bg-surfaceElevated border border-border rounded-full text-textdim hover:text-white hover:bg-surfaceInteractive shadow-lg transition-colors duration-150"
            tabIndex={0}
            aria-label="Expand sidebar"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>

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
              role="navigation"
              aria-label="Mobile navigation"
            >
              {sidebarContent}
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
