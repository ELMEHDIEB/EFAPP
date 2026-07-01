"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

const cn = (...classes) => classes.filter(Boolean).join(" ");

const AnimatedTabs = ({
  tabs,
  activeTab: externalActiveTab,
  onChange,
  variant = "default",
  className = ""
}) => {
  const [internalActiveTab, setInternalActiveTab] = useState(tabs[0]);
  const activeTab = externalActiveTab !== undefined ? externalActiveTab : internalActiveTab;

  const handleTabClick = (tab) => {
    if (onChange) onChange(tab);
    else setInternalActiveTab(tab);
  };

  const getTabId = (tab) => typeof tab === 'object' ? tab.id : tab;
  const getTabLabel = (tab) => typeof tab === 'object' ? tab.label : tab;
  const getTabIcon = (tab) => typeof tab === 'object' ? tab.icon : null;

  if (variant === "underline") {
    return (
      <div className={`relative flex items-center border-b border-border overflow-x-auto no-scrollbar ${className}`}>
        {tabs.map((tab, index) => {
          const isActive = getTabId(activeTab) === getTabId(tab);

          return (
            <button
              key={getTabId(tab) || index}
              type="button"
              onClick={() => handleTabClick(tab)}
              className={cn(
                "relative flex h-12 items-center px-4 text-sm font-bold transition-colors duration-200 whitespace-nowrap gap-2",
                isActive
                  ? "text-accent"
                  : "text-textdim hover:text-white"
              )}>
              {isActive && (
                <motion.div
                  layoutId={`active-tab-underline-${variant}`}
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 30,
                  }} />
              )}
              {getTabIcon(tab) && (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={getTabIcon(tab)} />
                </svg>
              )}
              <span className="relative z-10">{getTabLabel(tab)}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className={`relative flex w-full md:w-full max-w-3xl items-center rounded-full bg-surfaceElevated p-1 overflow-x-auto no-scrollbar border border-white/5 ${className}`}>
      {tabs.map((tab, index) => {
        const isActive = getTabId(activeTab) === getTabId(tab);

        return (
          <button
            key={getTabId(tab) || index}
            type="button"
            onClick={() => handleTabClick(tab)}
            className={cn(
              "relative flex h-10 items-center rounded-full px-4 text-sm font-bold transition-colors duration-200 whitespace-nowrap gap-2 flex-1 justify-center",
              isActive
                ? "text-white"
                : "text-textdim hover:text-white"
            )}>
            {isActive && (
              <motion.div
                layoutId={`active-tab-background-${variant}`}
                className="absolute inset-0 rounded-full bg-accent/20 border border-accent/50"
                initial={false}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 30,
                }} />
            )}
            {getTabIcon(tab) && (
              <svg className="w-4 h-4 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={getTabIcon(tab)} />
              </svg>
            )}
            <span className="relative z-10">{getTabLabel(tab)}</span>
          </button>
        );
      })}
    </div>
  );
};

export default AnimatedTabs;

