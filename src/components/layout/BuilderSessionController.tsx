"use client";

import { useEffect, useMemo, useRef } from "react";

import {
  CURRENT_WORKING_SESSION_SCHEMA_VERSION,
  getBuilderSnapshotFingerprint,
  persistWorkingSession,
} from "@/lib/contractPersistence";
import { getBuilderStatus } from "@/lib/exportRequirements";
import { captureBuilderEvent } from "@/lib/telemetry";
import { useFlowStore } from "@/store/useFlowStore";

export default function BuilderSessionController() {
  const activeTemplateId = useFlowStore((state) => state.activeTemplateId);
  const nodes = useFlowStore((state) => state.nodes);
  const edges = useFlowStore((state) => state.edges);
  const nodeData = useFlowStore((state) => state.nodeData);
  const customCode = useFlowStore((state) => state.customCode);
  const editorMode = useFlowStore((state) => state.editorMode);
  const baselineFingerprint = useFlowStore((state) => state.baselineFingerprint);
  const activeSavedContractId = useFlowStore((state) => state.activeSavedContractId);
  const lastNamedSaveAt = useFlowStore((state) => state.lastNamedSaveAt);
  const restoredDraftAt = useFlowStore((state) => state.restoredDraftAt);
  const syncDraftPersistence = useFlowStore((state) => state.syncDraftPersistence);
  const reportedRestoredDraftAtRef = useRef<number | null>(null);

  const snapshot = useMemo(
    () => ({
      activeTemplateId,
      nodes,
      edges,
      nodeData,
      customCode,
      editorMode,
    }),
    [activeTemplateId, nodes, edges, nodeData, customCode, editorMode]
  );

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const updatedAt = Date.now();
      persistWorkingSession({
        schemaVersion: CURRENT_WORKING_SESSION_SCHEMA_VERSION,
        updatedAt,
        activeTemplateId: snapshot.activeTemplateId,
        nodes: snapshot.nodes,
        edges: snapshot.edges,
        nodeData: snapshot.nodeData,
        customCode: snapshot.customCode,
        editorMode: snapshot.editorMode,
        baselineFingerprint,
        activeSavedContractId,
        lastNamedSaveAt,
      });

      const hasUnsavedChanges =
        getBuilderSnapshotFingerprint(snapshot) !== baselineFingerprint;
      syncDraftPersistence(updatedAt, hasUnsavedChanges);
    }, 250);

    return () => {
      window.clearTimeout(handle);
    };
  }, [
    snapshot,
    baselineFingerprint,
    activeSavedContractId,
    lastNamedSaveAt,
    syncDraftPersistence,
  ]);

  useEffect(() => {
    if (!restoredDraftAt) return;
    if (reportedRestoredDraftAtRef.current === restoredDraftAt) return;

    const status = getBuilderStatus(nodeData, nodes, {
      activeTemplateId,
      edges,
    });
    captureBuilderEvent("builder_draft_restored", {
      templateId: activeTemplateId,
      editorMode,
      blockerIds: status.blockers.map((item) => item.id).join(","),
      healthIssueIds: status.warnings.map((item) => item.id).join(","),
      readyToExport: status.readyToExport,
      hasNamedSave: Boolean(activeSavedContractId),
    });
    reportedRestoredDraftAtRef.current = restoredDraftAt;
  }, [
    activeSavedContractId,
    activeTemplateId,
    edges,
    editorMode,
    nodeData,
    nodes,
    restoredDraftAt,
  ]);

  return null;
}
