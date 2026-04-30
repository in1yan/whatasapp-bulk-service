"use client";

import React from "react";

export const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
  return (
    <div className={`bg-background border border-border-warm rounded-[4px] p-6 ${className}`}>
      {children}
    </div>
  );
};

export const Tabs = ({ 
  tabs, 
  activeTab, 
  onTabChange 
}: { 
  tabs: string[]; 
  activeTab: string; 
  onTabChange: (tab: string) => void 
}) => {
  return (
    <div className="flex gap-8 mb-8 border-b border-border-warm">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          className={`pb-2 text-base font-medium font-mono transition-colors ${
            activeTab === tab 
              ? "text-foreground border-b-2 border-mid-gray" 
              : "text-mid-gray hover:text-foreground"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
};
