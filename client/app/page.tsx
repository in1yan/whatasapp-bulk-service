"use client";

import React, { useState, useEffect } from "react";
import { Tabs } from "@/components/ui/Tabs";
import { SessionManager } from "@/components/SessionManager";
import { BulkSender } from "@/components/BulkSender";
import { SingleSender } from "@/components/SingleSender";

export default function Home() {
  const [activeTab, setActiveTab] = useState("Session");
  const tabs = ["Session", "Single Message", "Bulk Send"];
  const [apiStatus, setApiStatus] = useState<"CONNECTED" | "DISCONNECTED" | "CHECKING">("CHECKING");

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch("/api/v1/health");
        if (res.ok) {
          setApiStatus("CONNECTED");
        } else {
          setApiStatus("DISCONNECTED");
        }
      } catch (err) {
        setApiStatus("DISCONNECTED");
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground font-mono selection:bg-accent-blue selection:text-foreground">
      <header className="border-b border-border-warm bg-background sticky top-0 z-10">
        <div className="max-w-[900px] mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-foreground flex items-center justify-center rounded-[4px]">
              <span className="text-background font-bold text-lg">B</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight">BOGUS_BROADCAST_v1.0</h1>
          </div>
          <div className="hidden sm:flex gap-4 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="text-mid-gray">API:</span>
              <span className={apiStatus === "CONNECTED" ? "text-success-green" : apiStatus === "CHECKING" ? "text-warning-orange" : "text-danger-red"}>
                {apiStatus}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[900px] mx-auto px-6 py-12">
        <div className="mb-12">
          <h2 className="text-4xl font-bold mb-4 tracking-tighter">Terminal Dashboard</h2>
          <p className="text-mid-gray max-w-lg">
            Manage your WhatsApp sessions and orchestrate bulk messaging campaigns from a single, 
            terminal-native interface.
          </p>
        </div>

        <Tabs 
          tabs={tabs} 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
        />

        <div className="mt-8 transition-all duration-300">
          {activeTab === "Session" && <SessionManager />}
          {activeTab === "Single Message" && <SingleSender />}
          {activeTab === "Bulk Send" && <BulkSender />}
        </div>
      </main>

      <footer className="max-w-[900px] mx-auto px-6 py-12 mt-12 border-t border-border-warm text-mid-gray text-xs flex justify-between">
        <div>© 2026 BOGUS_ENTERPRISE_SYSTEMS</div>
        <div className="flex gap-6">
          <a href="#" className="hover:text-foreground underline underline-offset-4">DOCUMENTATION</a>
          <a href="#" className="hover:text-foreground underline underline-offset-4">SUPPORT</a>
          <a href="#" className="hover:text-foreground underline underline-offset-4">GITHUB</a>
        </div>
      </footer>
    </div>
  );
}
