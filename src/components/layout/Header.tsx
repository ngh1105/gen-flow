"use client";

import { Blocks, Github } from "lucide-react";
import TemplateSwitcher from "./TemplateSwitcher";
import ModeToggle from "./ModeToggle";

export default function Header() {
  return (
    <header className="flex items-center justify-between px-5 py-3 border-b border-border bg-surface/80 backdrop-blur-md z-50">
      {/* Logo & Branding */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-accent-purple to-accent-blue">
          <Blocks className="w-5 h-5 text-white" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-base font-bold tracking-tight leading-none">
            Gen<span className="text-accent-purple">Flow</span>
          </h1>
          <p className="text-[11px] text-muted leading-none mt-0.5">
            Visual Builder for GenLayer
          </p>
        </div>
        <span className="ml-1 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-accent-purple/15 text-accent-purple border border-accent-purple/25">
          MVP
        </span>
      </div>

      {/* Center: Template Switcher */}
      <div className="flex items-center gap-3">
        <TemplateSwitcher />
        <div className="w-px h-6 bg-border" />
        <ModeToggle />
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        <span className="hidden sm:block text-xs text-muted">
          Drag → Connect → Generate
        </span>
        <a
          href="https://github.com/genflow-labs/genflow"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center w-8 h-8 rounded-lg border border-border hover:border-accent-purple/40 hover:bg-surface-hover transition-all"
        >
          <Github className="w-4 h-4 text-muted" />
        </a>
      </div>
    </header>
  );
}
