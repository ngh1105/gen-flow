"use client";

import { useState, useSyncExternalStore } from "react";
import {
  ArrowRight,
  Blocks,
  CheckCircle2,
  Code2,
  FolderOpen,
  Layers,
  MousePointerClick,
  Sparkles,
  X,
} from "lucide-react";
import { getAllTemplates } from "@/engine/templateRegistry";
import { useDialogFocusTrap } from "@/hooks/useDialogFocusTrap";

const WELCOME_DISMISSED_KEY = "genflow-welcome-dismissed-v3";

interface WelcomeOverlayProps {
  onOpenWizard?: () => void;
}

export default function WelcomeOverlay({ onOpenWizard }: WelcomeOverlayProps) {
  const templates = getAllTemplates();
  const templateCount = templates.length;
  const featuredCount = templates.filter((template) => template.featured).length;
  const [dismissed, setDismissed] = useState(false);
  const isClient = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false
  );
  const show =
    isClient && !dismissed && !localStorage.getItem(WELCOME_DISMISSED_KEY);
  const dialogRef = useDialogFocusTrap({ open: show });

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(WELCOME_DISMISSED_KEY, "true");
  };

  const handleOpenWizard = () => {
    handleDismiss();
    onOpenWizard?.();
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-md px-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-overlay-title"
        aria-describedby="welcome-overlay-description"
        tabIndex={-1}
        className="relative w-full max-w-xl bg-surface border-2 border-foreground shadow-[4px_4px_0_0_var(--foreground)] overflow-hidden outline-none"
      >
        {/* Top thick bar */}
        <div className="h-2 bg-foreground" />

        {/* Close button */}
        <button
          onClick={handleDismiss}
          aria-label="Dismiss onboarding"
          className="absolute top-4 right-4 p-1.5 rounded-none border border-transparent hover:border-foreground hover:bg-surface-hover transition-all duration-150 text-muted hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content */}
        <div className="px-7 py-6">
          {/* Header */}
          <div className="flex items-start gap-4 mb-6 pb-5 border-b border-border">
            <div className="flex items-center justify-center w-12 h-12 rounded-none bg-foreground text-background">
              <Blocks className="w-6 h-6" />
            </div>
            <div>
              <h2
                id="welcome-overlay-title"
                className="text-xl font-display font-black uppercase tracking-tight"
              >
                GEN<span className="text-muted-foreground">FLOW</span>
              </h2>
              <p className="text-[11px] text-muted font-mono uppercase tracking-widest mt-1">
                Beta Onboarding // First Export
              </p>
              <p
                id="welcome-overlay-description"
                className="mt-3 max-w-md text-sm leading-relaxed text-muted"
              >
                Start with one successful export. GenFlow keeps an autosaved draft
                in this browser, so you can safely come back and continue.
              </p>
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-3 mb-6">
            {[
              {
                step: "1",
                numColor: "text-background",
                numBg: "bg-foreground",
                iconColor: "text-foreground",
                icon: Sparkles,
                text: "Use Smart Wizard or pick a featured template to start from a working flow",
              },
              {
                step: "2",
                numColor: "text-foreground",
                numBg: "bg-surface border border-foreground text-foreground",
                iconColor: "text-foreground/70",
                icon: MousePointerClick,
                text: "Fill the required inputs on the active nodes. Custom Compose still supports drag or click Add",
              },
              {
                step: "3",
                numColor: "text-foreground",
                numBg: "bg-surface border border-foreground text-foreground",
                iconColor: "text-foreground/70",
                icon: Code2,
                text: "Watch the export checklist until every required badge says done",
              },
              {
                step: "4",
                numColor: "text-foreground",
                numBg: "bg-surface border border-foreground text-foreground",
                iconColor: "text-foreground/70",
                icon: CheckCircle2,
                text: "Save a named version when you want a milestone, then export or continue in Code Mode",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.step} className="flex items-center gap-3.5 group">
                  <span
                    className={`flex items-center justify-center w-7 h-7 rounded-none text-xs font-bold transition-transform group-hover:scale-105 ${item.numBg} ${item.numColor}`}
                  >
                    {item.step}
                  </span>
                  <Icon className={`w-4 h-4 ${item.iconColor} shrink-0`} />
                  <span className="text-sm font-medium text-foreground/80">{item.text}</span>
                </div>
              );
            })}
          </div>

          {/* Features highlight */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="px-4 py-3 rounded-none bg-surface border border-border group hover:border-foreground transition-colors">
              <p className="text-[10px] font-display font-bold text-foreground uppercase tracking-widest group-hover:text-foreground transition-colors">
                {templateCount} Templates
              </p>
              <p className="text-[11px] text-muted mt-1 leading-tight">
                {featuredCount} featured beta-ready starting points
              </p>
            </div>
            <div className="px-4 py-3 rounded-none bg-surface border border-border group hover:border-foreground transition-colors">
              <p className="text-[10px] font-display font-bold text-foreground uppercase tracking-widest group-hover:text-foreground transition-colors">
                Draft Autosave
              </p>
              <p className="text-[11px] text-muted mt-1 leading-tight">
                Drafts restore in this browser after refresh or a crash
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              onClick={handleOpenWizard}
              data-testid="welcome-open-wizard"
              className="relative group flex items-center justify-center gap-2 px-5 py-3.5 rounded-none bg-foreground text-background text-sm font-display font-bold uppercase tracking-wider overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-200 ease-out" />
              <span className="relative z-10 flex items-center gap-2">
                Start With Wizard
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
            <button
              onClick={handleDismiss}
              className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-none border border-border bg-background text-sm font-display font-bold uppercase tracking-wider text-foreground transition-all duration-150 hover:border-foreground hover:bg-surface-hover"
            >
              Skip To Canvas
              <Layers className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-4 flex items-start gap-2 border border-border bg-background px-3 py-2 text-[11px] text-muted">
            <FolderOpen className="mt-0.5 h-3.5 w-3.5 shrink-0 text-foreground" />
            <p>
              Named saves appear in <span className="text-foreground">My Contracts</span>.
              Your in-progress draft keeps autosaving separately.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
