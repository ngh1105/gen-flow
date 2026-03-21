"use client";

import { useState } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { FolderOpen, Sparkles } from "lucide-react";
import Header from "@/components/layout/Header";
import CanvasPanel from "@/components/layout/CanvasPanel";
import CodePanel from "@/components/layout/CodePanel";
import NodeSidebar from "@/components/layout/NodeSidebar";
import CodeEditorMode from "@/components/layout/CodeEditorMode";
import WelcomeOverlay from "@/components/layout/WelcomeOverlay";
import ResponsiveWarning from "@/components/layout/ResponsiveWarning";
import MyContractsPanel from "@/components/layout/MyContractsPanel";
import WizardOverlay from "@/components/layout/WizardOverlay";
import { useFlowStore } from "@/store/useFlowStore";

function BuilderContent() {
  const editorMode = useFlowStore((s) => s.editorMode);
  const [contractsOpen, setContractsOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <Header />

      {/* Toolbar row */}
      <div className="flex items-center justify-between px-4 py-1.5 border-b border-border bg-surface/50">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWizardOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-accent-purple hover:bg-accent-purple/10 border border-accent-purple/20 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Wizard
          </button>
          <span className="text-[10px] text-muted uppercase tracking-wider font-semibold">
            {editorMode === "visual" ? "Visual Builder" : "Code Editor"}
          </span>
        </div>
        <button
          onClick={() => setContractsOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-muted hover:text-foreground hover:bg-surface-hover border border-border transition-all"
        >
          <FolderOpen className="w-3.5 h-3.5" />
          My Contracts
        </button>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {editorMode === "visual" ? (
          <>
            {/* Left: Node Sidebar */}
            <NodeSidebar />

            {/* Center: Canvas */}
            <div className="flex-1 h-full">
              <CanvasPanel />
            </div>

            {/* Right: Code Panel 30% */}
            <div className="w-[30%] h-full">
              <CodePanel />
            </div>
          </>
        ) : (
          /* Code Mode: Full-width editor */
          <CodeEditorMode />
        )}
      </div>

      {/* Overlays */}
      <WelcomeOverlay />
      <ResponsiveWarning />
      <MyContractsPanel
        open={contractsOpen}
        onClose={() => setContractsOpen(false)}
      />
      <WizardOverlay
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
      />
    </div>
  );
}

export default function Home() {
  return (
    <ReactFlowProvider>
      <BuilderContent />
    </ReactFlowProvider>
  );
}
