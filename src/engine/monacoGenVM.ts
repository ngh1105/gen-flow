/**
 * monacoGenVM.ts
 *
 * Bridges genvm-linter.ts diagnostics → Monaco Editor markers + CodeAction quick-fixes.
 * Call `registerGenVMLinter(editor, monaco)` once after Monaco mounts.
 */

import type * as Monaco from "monaco-editor";
import { lintGenVMCode } from "./genvm-linter";
import type { LintDiagnostic } from "./genvm-linter";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MonacoInstance = typeof Monaco | any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EditorInstance = Monaco.editor.IStandaloneCodeEditor | any;

const MARKER_OWNER = "genvm-linter";

// Convert linter severity → Monaco MarkerSeverity
function toMarkerSeverity(monaco: MonacoInstance, severity: LintDiagnostic["severity"]) {
  switch (severity) {
    case "error":   return monaco.MarkerSeverity.Error;
    case "warning": return monaco.MarkerSeverity.Warning;
    case "info":    return monaco.MarkerSeverity.Info;
    default:        return monaco.MarkerSeverity.Warning;
  }
}

/** Run linter on a code string and return diagnostics (standalone, no editor required) */
export function runLinterOnCode(
  code: string,
  onDiagnostics?: (diags: LintDiagnostic[]) => void
): LintDiagnostic[] {
  const diagnostics = lintGenVMCode(code);
  onDiagnostics?.(diagnostics);
  return diagnostics;
}

/** Run linter on current model content and push markers to Monaco */
function runLinter(
  editor: EditorInstance,
  monaco: MonacoInstance,
  onDiagnostics?: (diags: LintDiagnostic[]) => void
) {
  const model = editor.getModel();
  if (!model) return;

  const code = model.getValue();
  const diagnostics = lintGenVMCode(code);

  const markers: Monaco.editor.IMarkerData[] = diagnostics.map((d) => ({
    severity: toMarkerSeverity(monaco, d.severity),
    startLineNumber: d.line,
    startColumn: d.startCol,
    endLineNumber: d.line,
    endColumn: d.endCol,
    message: d.message,
    code: d.ruleId,
    source: "GenVM Linter",
  }));

  monaco.editor.setModelMarkers(model, MARKER_OWNER, markers);
  onDiagnostics?.(diagnostics);
}

/**
 * Register GenVM linter on a Monaco editor instance.
 *
 * - Runs on mount and on every content change (debounced 400ms)
 * - Registers a CodeActionProvider for quick-fix actions (💡 lightbulb)
 *
 * @param editor  Monaco editor instance from the `onMount` callback
 * @param monaco  Monaco namespace from the `onMount` callback
 * @param onDiagnostics  Optional callback to receive diagnostics (for LinterPanel)
 */
// Prevent duplicate provider registration across multiple editor mounts
const registeredCodeActionLanguages = new Set<string>();

export function registerGenVMLinter(
  editor: EditorInstance,
  monaco: MonacoInstance,
  onDiagnostics?: (diags: LintDiagnostic[]) => void
): void {
  // Initial lint pass
  runLinter(editor, monaco, onDiagnostics);

  // Re-lint on content change, debounced
  let debounce: ReturnType<typeof setTimeout> | null = null;
  editor.onDidChangeModelContent(() => {
    if (debounce) clearTimeout(debounce);
    debounce = setTimeout(() => {
      runLinter(editor, monaco, onDiagnostics);
    }, 400);
  });

  const model = editor.getModel();
  if (!model) return;

  const language = model.getLanguageId();
  if (registeredCodeActionLanguages.has(language)) return;

  monaco.languages.registerCodeActionProvider(language, {
    provideCodeActions(
      model: Monaco.editor.ITextModel,
      range: Monaco.Range,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      _context: Monaco.languages.CodeActionContext
    ): Monaco.languages.CodeActionList {
      const code = model.getValue();
      const diagnostics = lintGenVMCode(code);
      const actions: Monaco.languages.CodeAction[] = [];

      for (const diag of diagnostics) {
        if (!diag.quickFix) continue;

        // Only show actions relevant to cursor position
        if (diag.line < range.startLineNumber - 2 || diag.line > range.endLineNumber + 2) continue;

        const fix = diag.quickFix;
        let editRange: Monaco.IRange;

        if (fix.insertBefore) {
          // Insert new line before the diagnostic line
          editRange = {
            startLineNumber: diag.line,
            startColumn: 1,
            endLineNumber: diag.line,
            endColumn: 1,
          };
          actions.push({
            title: fix.label,
            diagnostics: [],
            kind: "quickfix",
            edit: {
              edits: [{
                resource: model.uri,
                textEdit: {
                  range: editRange,
                  text: fix.replacement,
                },
                versionId: model.getVersionId(),
              }],
            },
            isPreferred: true,
          });
        } else if (fix.replaceRange) {
          editRange = {
            startLineNumber: fix.replaceRange.startLine,
            startColumn: 1,
            endLineNumber: fix.replaceRange.endLine,
            endColumn: model.getLineLength(fix.replaceRange.endLine) + 1,
          };
          actions.push({
            title: fix.label,
            diagnostics: [],
            kind: "quickfix",
            edit: {
              edits: [{
                resource: model.uri,
                textEdit: {
                  range: editRange,
                  text: fix.replacement,
                },
                versionId: model.getVersionId(),
              }],
            },
            isPreferred: true,
          });
        }
      }

      return { actions, dispose: () => {} };
    },
  });
  registeredCodeActionLanguages.add(language);
}

/** Clear all GenVM linter markers from editor model */
export function clearGenVMMarkers(editor: EditorInstance, monaco: MonacoInstance): void {
  const model = editor.getModel();
  if (model) monaco.editor.setModelMarkers(model, MARKER_OWNER, []);
}
