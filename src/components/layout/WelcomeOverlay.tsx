"use client";

import { useState } from "react";
import { Blocks, X, ArrowRight, MousePointerClick, Layers, Code2, FolderOpen } from "lucide-react";

export default function WelcomeOverlay() {
  const [show, setShow] = useState(() => {
    if (typeof window === "undefined") return false;
    return !localStorage.getItem("genflow-welcome-dismissed-v2");
  });

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem("genflow-welcome-dismissed-v2", "true");
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg mx-4 glass-card border-accent-purple/30 overflow-hidden">
        {/* Gradient top bar */}
        <div className="h-1 bg-gradient-to-r from-accent-purple via-accent-blue to-accent-green" />

        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1 rounded-md hover:bg-surface-hover transition-colors text-muted hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content */}
        <div className="px-6 py-5">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-accent-purple to-accent-blue">
              <Blocks className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                Welcome to Gen<span className="text-accent-purple">Flow</span>
              </h2>
              <p className="text-xs text-muted">Visual Builder for GenLayer</p>
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-2.5 mb-5">
            {[
              {
                step: "1",
                color: "text-accent-purple",
                bg: "bg-accent-purple/10",
                icon: Layers,
                text: "Choose a contract template from the dropdown",
              },
              {
                step: "2",
                color: "text-emerald-400",
                bg: "bg-emerald-500/10",
                icon: MousePointerClick,
                text: "Drag nodes from the sidebar & fill in the fields",
              },
              {
                step: "3",
                color: "text-blue-400",
                bg: "bg-blue-500/10",
                icon: Code2,
                text: "Switch to Code Mode for direct editing & snippets",
              },
              {
                step: "4",
                color: "text-orange-400",
                bg: "bg-orange-500/10",
                icon: FolderOpen,
                text: "Save, load, and download your contracts",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.step} className="flex items-center gap-3">
                  <span
                    className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${item.bg} ${item.color}`}
                  >
                    {item.step}
                  </span>
                  <Icon className={`w-4 h-4 ${item.color} shrink-0`} />
                  <span className="text-sm text-foreground/80">{item.text}</span>
                </div>
              );
            })}
          </div>

          {/* Features highlight */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="px-3 py-2 rounded-lg bg-accent-purple/5 border border-accent-purple/10">
              <p className="text-[10px] font-semibold text-accent-purple uppercase tracking-wider">8 Templates</p>
              <p className="text-[10px] text-muted mt-0.5">AI, DAO, Oracle, DeFi, Games & more</p>
            </div>
            <div className="px-3 py-2 rounded-lg bg-accent-blue/5 border border-accent-blue/10">
              <p className="text-[10px] font-semibold text-accent-blue uppercase tracking-wider">16 Node Types</p>
              <p className="text-[10px] text-muted mt-0.5">Drag & drop from sidebar</p>
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={handleDismiss}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-accent-purple to-accent-blue text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Start Building
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
