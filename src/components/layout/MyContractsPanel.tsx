"use client";

import { useState } from "react";
import {
  FolderOpen,
  Trash2,
  Upload,
  X,
  Save,
  FileCode,
} from "lucide-react";
import { useFlowStore } from "@/store/useFlowStore";

interface MyContractsPanelProps {
  open: boolean;
  onClose: () => void;
}

export default function MyContractsPanel({
  open,
  onClose,
}: MyContractsPanelProps) {
  const savedContracts = useFlowStore((s) => s.savedContracts);
  const loadContract = useFlowStore((s) => s.loadContract);
  const deleteContract = useFlowStore((s) => s.deleteContract);
  const saveContract = useFlowStore((s) => s.saveContract);
  const nodeData = useFlowStore((s) => s.nodeData);
  const [saveName, setSaveName] = useState("");
  const [showSave, setShowSave] = useState(false);

  const handleSave = () => {
    const name = saveName.trim() || nodeData.contractName || "Untitled Contract";
    saveContract(name);
    setSaveName("");
    setShowSave(false);
  };

  const handleLoad = (id: string) => {
    loadContract(id);
    onClose();
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        data-testid="my-contracts-panel"
        className="fixed top-0 right-0 z-[90] h-full w-[360px] bg-surface border-l border-border shadow-none shadow-none flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-foreground" />
            <span className="text-sm font-display font-medium">My Contracts</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-none bg-foreground text-background hover:opacity-90 active:scale-[0.98] font-mono">
              {savedContracts.length}
            </span>
          </div>
          <button
            onClick={onClose}
            data-testid="close-contracts-panel"
            className="p-1 rounded-none hover:bg-surface-hover text-muted hover:text-foreground transition-colors duration-150"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Save current */}
        <div className="px-4 py-3 border-b border-border">
          {showSave ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="Contract name..."
                data-testid="save-contract-name-input"
                className="flex-1 px-3 py-1.5 text-sm bg-background border border-border rounded-none text-foreground placeholder:text-muted/50 focus:outline-none focus:border-foreground"
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                autoFocus
              />
              <button
                onClick={handleSave}
                data-testid="confirm-save-contract"
                className="px-3 py-1.5 rounded-none text-xs font-medium bg-foreground text-background hover:opacity-90 active:scale-[0.98] hover:bg-foreground border border-foreground transition-all duration-150"
              >
                Save
              </button>
              <button
                onClick={() => setShowSave(false)}
                className="p-1.5 rounded-none text-muted hover:text-foreground hover:bg-surface-hover"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowSave(true)}
              data-testid="save-current-contract"
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-none text-xs font-medium bg-foreground text-background hover:opacity-90 active:scale-[0.98] hover:bg-foreground border border-foreground transition-all duration-150"
            >
              <Save className="w-3.5 h-3.5" />
              Save Current Contract
            </button>
          )}
        </div>

        {/* Contract list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {savedContracts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted">
              <FileCode className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm font-medium">No saved contracts</p>
              <p className="text-xs mt-1 opacity-60">
                Save a contract to see it here
              </p>
            </div>
          ) : (
            savedContracts
              .slice()
              .sort((a, b) => b.savedAt - a.savedAt)
              .map((contract) => (
                <div
                  key={contract.id}
                  data-testid={`saved-contract-row-${contract.id}`}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-none border border-border hover:border-foreground bg-background hover:bg-surface-hover transition-all duration-150 group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {contract.name}
                    </p>
                    <p className="text-[10px] text-muted mt-0.5">
                      {contract.templateId} ·{" "}
                      {new Date(contract.savedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-150">
                    <button
                      onClick={() => handleLoad(contract.id)}
                      data-testid={`load-contract-${contract.id}`}
                      className="p-1.5 rounded-none text-foreground hover:bg-foreground transition-colors duration-150"
                      title="Load contract"
                    >
                      <Upload className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteContract(contract.id)}
                      data-testid={`delete-contract-${contract.id}`}
                      className="p-1.5 rounded-none text-foreground hover:bg-foreground transition-colors duration-150"
                      title="Delete contract"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
          )}
        </div>
      </div>
    </>
  );
}
