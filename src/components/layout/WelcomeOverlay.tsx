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
      <div className="relative w-full max-w-lg mx-4 glass-card border-foreground overflow-hidden">
        {/* Gradient top bar */}
        <div className="h-1 bg-foreground" />

        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1 rounded-none hover:bg-surface-hover transition-colors duration-150 text-muted hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content */}
        <div className="px-6 py-5">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-none bg-foreground">
              <Blocks className="w-5 h-5 text-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                Welcome to Gen<span className="text-foreground">Flow</span>
              </h2>
              <p className="text-xs text-muted">Visual Builder for GenLayer</p>
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-2.5 mb-5">
            {[
              {
                step: "1",
                color: "text-foreground",
                bg: "bg-foreground",
                icon: Layers,
                text: "Choose a contract template from the dropdown",
              },
              {
                step: "2",
                color: "text-foreground",
                bg: "bg-surface",
                icon: MousePointerClick,
                text: "Drag nodes from the sidebar & fill in the fields",
              },
              {
                step: "3",
                color: "text-foreground",
                bg: "bg-surface",
                icon: Code2,
                text: "Switch to Code Mode for direct editing & snippets",
              },
              {
                step: "4",
                color: "text-foreground",
                bg: "bg-surface",
                icon: FolderOpen,
                text: "Save, load, and download your contracts",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.step} className="flex items-center gap-3">
                  <span
                    className={`flex items-center justify-center w-6 h-6 rounded-none text-xs font-bold ${item.bg} ${item.color}`}
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
            <div className="px-3 py-2 rounded-none bg-foreground border border-foreground">
              <p className="text-[10px] font-display font-medium text-foreground uppercase tracking-widest">8 Templates</p>
              <p className="text-[10px] text-muted mt-0.5">AI, DAO, Oracle, DeFi, Games & more</p>
            </div>
            <div className="px-3 py-2 rounded-none bg-foreground border border-foreground">
              <p className="text-[10px] font-display font-medium text-foreground uppercase tracking-widest">16 Node Types</p>
              <p className="text-[10px] text-muted mt-0.5">Drag & drop from sidebar</p>
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={handleDismiss}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-none bg-foreground text-background text-sm font-display font-medium hover:opacity-90 transition-all duration-150"
          >
            Start Building
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
