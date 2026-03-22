/**
 * GenVM Linter — Client-side rule-based linter for GenLayer Intelligent Contracts.
 *
 * Rules aligned with the official genlayerlabs/genvm-linter:
 *   - Safety rules (E02x): forbidden imports, forbidden calls, nondet safety
 *   - Structure rules (W010/W011, E011–E022): contract structure, storage types, decorators
 *
 * This is a regex/string-based implementation — no Python AST, no backend.
 * Produces Monaco-compatible diagnostics with optional quick-fix suggestions.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface QuickFix {
  /** Label shown in Monaco lightbulb menu */
  label: string;
  /** Replacement text for the affected lines */
  replacement: string;
  /** Line range to replace (1-indexed, inclusive). If omitted uses diagnostic line. */
  replaceRange?: { startLine: number; endLine: number };
  /** If true, insert `replacement` as a new line BEFORE `line` instead of replacing */
  insertBefore?: boolean;
}

export interface LintDiagnostic {
  line: number; // 1-indexed
  startCol: number;
  endCol: number;
  severity: "error" | "warning" | "info";
  message: string;
  /** Matches official genvm-linter rule IDs (E011, W020, etc.) */
  ruleId: string;
  quickFix?: QuickFix;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getLines(code: string): string[] {
  return code.split("\n");
}

interface FunctionRange {
  name: string;
  startLine: number; // 1-indexed, inclusive
  endLine: number;   // 1-indexed, inclusive
}

function getFunctionRanges(codeLines: string[]): FunctionRange[] {
  const ranges: FunctionRange[] = [];

  for (let i = 0; i < codeLines.length; i++) {
    const line = codeLines[i];
    const match = line.match(/^(\s*)def\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/);
    if (!match) continue;

    const defIndent = match[1].length;
    let end = i + 1;

    for (let j = i + 1; j < codeLines.length; j++) {
      const next = codeLines[j];
      if (next.trim() === "") continue;
      const nextIndent = next.length - next.trimStart().length;
      if (nextIndent <= defIndent) break;
      end = j + 1;
    }

    ranges.push({
      name: match[2],
      startLine: i + 1,
      endLine: end,
    });
  }

  return ranges;
}

function getConsensusTaskNames(code: string): Set<string> {
  const names = new Set<string>();

  const eqPattern = /gl\.eq_principle\.\w+\s*\(\s*([A-Za-z_][A-Za-z0-9_]*)/g;
  let match: RegExpExecArray | null;
  while ((match = eqPattern.exec(code)) !== null) {
    names.add(match[1]);
  }

  const runPattern = /gl\.vm\.run_nondet\s*\(\s*([A-Za-z_][A-Za-z0-9_]*)(?:\s*,\s*([A-Za-z_][A-Za-z0-9_]*))?/g;
  while ((match = runPattern.exec(code)) !== null) {
    names.add(match[1]);
    if (match[2]) names.add(match[2]);
  }

  return names;
}

function getConsensusFunctionRanges(codeLines: string[]): FunctionRange[] {
  const code = codeLines.join("\n");
  const taskNames = getConsensusTaskNames(code);
  if (taskNames.size === 0) return [];

  return getFunctionRanges(codeLines).filter((r) => taskNames.has(r.name));
}

function isLineInsideRanges(line: number, ranges: FunctionRange[]): boolean {
  return ranges.some((r) => line >= r.startLine && line <= r.endLine);
}


function findAllMatchingLines(codeLines: string[], pattern: RegExp): number[] {
  const result: number[] = [];
  for (let i = 0; i < codeLines.length; i++) {
    if (pattern.test(codeLines[i])) result.push(i + 1);
  }
  return result;
}

// ---------------------------------------------------------------------------
// Safety Rules — mirrors safety.py in official genvm-linter
// ---------------------------------------------------------------------------

// Forbidden stdlib modules that introduce non-determinism / side effects
const FORBIDDEN_MODULES: readonly string[] = [
  "random", "os", "sys", "subprocess", "threading", "asyncio",
  "socket", "http", "requests", "pickle", "sqlite3", "hashlib",
  "time", "datetime", "uuid", "pathlib", "shutil", "tempfile",
  "io", "glob", "fnmatch", "logging", "warnings", "traceback",
];

// Forbidden function calls
const FORBIDDEN_CALLS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /\btime\.time\s*\(/, label: "time.time()" },
  { pattern: /\btime\.localtime\s*\(/, label: "time.localtime()" },
  { pattern: /\buuid\.uuid1\s*\(/, label: "uuid.uuid1()" },
  { pattern: /\buuid\.uuid4\s*\(/, label: "uuid.uuid4()" },
  { pattern: /\bfloat\s*\(/, label: "float()" },
  { pattern: /\bopen\s*\(/, label: "open()" },
  { pattern: /\bprint\s*\(/, label: "print()" },
];

function ruleForbiddenImports(codeLines: string[]): LintDiagnostic[] {
  const diags: LintDiagnostic[] = [];
  for (let i = 0; i < codeLines.length; i++) {
    const line = codeLines[i];
    if (line.trim().startsWith("#")) continue;
    for (const mod of FORBIDDEN_MODULES) {
      const importPatterns = [
        new RegExp(`^\\s*import\\s+${mod}\\b`),
        new RegExp(`^\\s*from\\s+${mod}\\b`),
      ];
      for (const pattern of importPatterns) {
        if (pattern.test(line)) {
          diags.push({
            line: i + 1,
            startCol: 1,
            endCol: line.length + 1,
            severity: "error",
            message: `Forbidden import: \`${mod}\` is not allowed in GenVM contracts (introduces non-determinism or unsafe side effects).`,
            ruleId: "forbidden-import",
            quickFix: {
              label: `Remove forbidden import \`${mod}\``,
              replacement: `# REMOVED: ${line.trim()} (forbidden in GenVM)`,
              replaceRange: { startLine: i + 1, endLine: i + 1 },
            },
          });
        }
      }
    }
  }
  return diags;
}

function ruleForbiddenCalls(codeLines: string[]): LintDiagnostic[] {
  const diags: LintDiagnostic[] = [];
  for (let i = 0; i < codeLines.length; i++) {
    const line = codeLines[i];
    if (line.trim().startsWith("#")) continue;
    for (const { pattern, label } of FORBIDDEN_CALLS) {
      if (pattern.test(line)) {
        diags.push({
          line: i + 1,
          startCol: 1,
          endCol: line.length + 1,
          severity: "error",
          message: `Forbidden call: \`${label}\` is not deterministic and may break GenVM consensus.`,
          ruleId: "forbidden-call",
        });
      }
    }
  }
  return diags;
}

// E023: .emit() forbidden in non-deterministic blocks
// E024: inter-contract calls forbidden in nondet blocks
// E025: nested run_nondet
// E026: storage writes forbidden in nondet blocks
function ruleNondetSafety(codeLines: string[]): LintDiagnostic[] {
  const diags: LintDiagnostic[] = [];
  const consensusRanges = getConsensusFunctionRanges(codeLines);
  if (consensusRanges.length === 0) return diags;

  for (const range of consensusRanges) {
    for (let lineNo = range.startLine; lineNo <= range.endLine; lineNo++) {
      const line = codeLines[lineNo - 1];
      if (!line || line.trim().startsWith("#")) continue;

      // E023: .emit() forbidden
      if (/\.emit\s*\(/.test(line)) {
        diags.push({
          line: lineNo,
          startCol: 1,
          endCol: line.length + 1,
          severity: "error",
          message: "[E023] `.emit()` is forbidden inside non-deterministic blocks (run_nondet / eq_principle).",
          ruleId: "E023",
        });
      }
      // E024: inter-contract calls forbidden
      if (/gl\.get_contract_at\s*\(/.test(line)) {
        diags.push({
          line: lineNo,
          startCol: 1,
          endCol: line.length + 1,
          severity: "error",
          message: "[E024] Inter-contract calls (`gl.get_contract_at`) are forbidden inside non-deterministic blocks.",
          ruleId: "E024",
        });
      }
      // E026: storage writes forbidden
      if (/self\.\w+\s*=/.test(line) && !/^\s*#/.test(line)) {
        diags.push({
          line: lineNo,
          startCol: 1,
          endCol: line.length + 1,
          severity: "error",
          message: "[E026] Storage write (`self.x = ...`) is forbidden inside non-deterministic blocks.",
          ruleId: "E026",
        });
      }
    }
  }
  return diags;
}

// ---------------------------------------------------------------------------
// Structure Rules — mirrors structure.py in official genvm-linter
// ---------------------------------------------------------------------------

// W010/W011: Contract must start with dependency header
function ruleDependencyHeader(codeLines: string[]): LintDiagnostic | null {
  // Look for header in first 3 lines
  const header = codeLines.slice(0, 3).find(
    (l) => /^\s*#\s*\{/.test(l) && (l.includes("py-genlayer") || l.includes("Depends") || l.includes("Seq"))
  );
  if (!header) {
    return {
      line: 1,
      startCol: 1,
      endCol: 1,
      severity: "warning",
      message: '[W010] Missing dependency header. GenVM contracts should start with `# { "Depends": "py-genlayer:test" }`.',
      ruleId: "W010",
      quickFix: {
        label: 'Add dependency header `# { "Depends": "py-genlayer:test" }`',
        replacement: '# { "Depends": "py-genlayer:test" }\n',
        insertBefore: true,
      },
    };
  }
  return null;
}

// Missing `from genlayer import *` (not in official but critical)
function ruleMissingImport(codeLines: string[]): LintDiagnostic | null {
  const has = codeLines.some((l) => /from genlayer import/.test(l) || /import genlayer/.test(l));
  if (!has) {
    return {
      line: 1,
      startCol: 1,
      endCol: 1,
      severity: "error",
      message: "Missing GenLayer import. Add `from genlayer import *` to access GenVM APIs.",
      ruleId: "missing-import",
      quickFix: {
        label: "Add `from genlayer import *`",
        replacement: "from genlayer import *\n",
        insertBefore: true,
      },
    };
  }
  return null;
}

// E011: Only one gl.Contract subclass per module
function ruleE011(codeLines: string[]): LintDiagnostic | null {
  const lines = findAllMatchingLines(codeLines, /class\s+\w+\s*\(\s*gl\.Contract\s*\)/);
  if (lines.length > 1) {
    return {
      line: lines[1],
      startCol: 1,
      endCol: codeLines[lines[1] - 1].length + 1,
      severity: "error",
      message: "[E011] Only one `gl.Contract` subclass is allowed per module. GenVM cannot determine which class to deploy.",
      ruleId: "E011",
    };
  }
  return null;
}

// E012: __init__ must NOT have @gl.public.write / @gl.public.view
function ruleE012(codeLines: string[]): LintDiagnostic[] {
  const diags: LintDiagnostic[] = [];
  for (let i = 0; i < codeLines.length; i++) {
    if (/def\s+__init__\s*\(/.test(codeLines[i])) {
      const prevLine = i > 0 ? codeLines[i - 1].trim() : "";
      if (prevLine.startsWith("@gl.public")) {
        diags.push({
          line: i,
          startCol: 1,
          endCol: codeLines[i - 1].length + 1,
          severity: "error",
          message: "[E012] `__init__` must not have `@gl.public.write` or `@gl.public.view` decorator. Constructors are private.",
          ruleId: "E012",
          quickFix: {
            label: "Remove public decorator from __init__",
            replacement: "",
            replaceRange: { startLine: i, endLine: i },
          },
        });
      }
    }
  }
  return diags;
}

// E013: Public methods cannot start with __
function ruleE013(codeLines: string[]): LintDiagnostic[] {
  const diags: LintDiagnostic[] = [];
  for (let i = 0; i < codeLines.length; i++) {
    const line = codeLines[i];
    if (/^\s{4}def\s+__(?!init__)\w+\s*\(/.test(line)) {
      const prevLine = i > 0 ? codeLines[i - 1].trim() : "";
      if (prevLine.startsWith("@gl.public")) {
        diags.push({
          line: i + 1,
          startCol: 1,
          endCol: line.length + 1,
          severity: "error",
          message: "[E013] Public methods cannot start with `__`. Rename the method or remove the `@gl.public` decorator.",
          ruleId: "E013",
        });
      }
    }
  }
  return diags;
}

// E015/E016: Raw int/list/dict in storage fields
const INVALID_STORAGE_MAP: Record<string, { replacement: string; code: string }> = {
  "list": { replacement: "DynArray[str]", code: "E016" },
  "List": { replacement: "DynArray[str]", code: "E016" },
  "dict": { replacement: "TreeMap[str, str]", code: "E016" },
  "Dict": { replacement: "TreeMap[str, str]", code: "E016" },
  "int":  { replacement: "u256 (or i256 for signed)", code: "E015" },
  "float": { replacement: "# float is non-deterministic in GenVM", code: "E015" },
};

function ruleE015_E016(codeLines: string[]): LintDiagnostic[] {
  const diags: LintDiagnostic[] = [];
  let inContractClass = false;
  let inMethod = false;

  for (let i = 0; i < codeLines.length; i++) {
    const line = codeLines[i];
    const trimmed = line.trim();
    const indent = line.length - line.trimStart().length;

    if (/class\s+\w+\s*\(\s*gl\.Contract\s*\)/.test(line)) {
      inContractClass = true;
      inMethod = false;
      continue;
    }

    if (!inContractClass) continue;
    if (trimmed === "") continue;

    // Left the contract class at module scope
    if (indent === 0) {
      inContractClass = false;
      inMethod = false;
      continue;
    }

    // Entering a method body
    if (indent === 4 && /^def\s+/.test(trimmed)) {
      inMethod = true;
      continue;
    }

    // Returned to class-level statement (field/decorator/comment) after being in method
    if (indent === 4 && !/^def\s+/.test(trimmed)) {
      inMethod = false;
    }

    if (inContractClass && !inMethod) {
      // Match field: "    fieldname: TYPE" or "    fieldname: TYPE[...]"
      const match = line.match(/^\s{4}(\w+)\s*:\s*(\w+)/);
      if (match) {
        const rawType = match[2];
        const invalid = INVALID_STORAGE_MAP[rawType];
        if (invalid) {
          const col = line.indexOf(rawType) + 1;
          diags.push({
            line: i + 1,
            startCol: col,
            endCol: col + rawType.length,
            severity: "error",
            message: `[${invalid.code}] \`${rawType}\` is not a valid GenVM storage type. Use \`${invalid.replacement}\` instead.`,
            ruleId: invalid.code,
            quickFix: {
              label: `Replace \`${rawType}\` with \`${invalid.replacement}\``,
              replacement: line.replace(new RegExp(`\\b${rawType}\\b`), invalid.replacement),
              replaceRange: { startLine: i + 1, endLine: i + 1 },
            },
          });
        }
      }
    }
  }
  return diags;
}

// E019: __receive__ and __on_bridge__ must have @gl.public.write
function ruleE019(codeLines: string[]): LintDiagnostic[] {
  const diags: LintDiagnostic[] = [];
  for (let i = 0; i < codeLines.length; i++) {
    if (/def\s+(__receive__|__on_bridge__)\s*\(/.test(codeLines[i])) {
      const prevLine = i > 0 ? codeLines[i - 1].trim() : "";
      if (!prevLine.includes("@gl.public.write")) {
        const methodMatch = codeLines[i].match(/def\s+(\w+)/);
        const name = methodMatch ? methodMatch[1] : "method";
        diags.push({
          line: i + 1,
          startCol: 1,
          endCol: codeLines[i].length + 1,
          severity: "error",
          message: `[E019] \`${name}\` requires \`@gl.public.write\` decorator.`,
          ruleId: "E019",
          quickFix: {
            label: "Add @gl.public.write decorator",
            replacement: "    @gl.public.write\n" + codeLines[i],
            replaceRange: { startLine: i + 1, endLine: i + 1 },
          },
        });
      }
    }
  }
  return diags;
}

// W020: View methods should have return type annotation
function ruleW020(codeLines: string[]): LintDiagnostic[] {
  const diags: LintDiagnostic[] = [];
  for (let i = 0; i < codeLines.length; i++) {
    const line = codeLines[i];
    if (/^\s{4}def\s+(?!__init__|_)\w+\s*\(self/.test(line) && !line.includes("->")) {
      const prevLine = i > 0 ? codeLines[i - 1].trim() : "";
      if (prevLine === "@gl.public.view") {
        const methodMatch = line.match(/def\s+(\w+)/);
        const name = methodMatch ? methodMatch[1] : "method";
        diags.push({
          line: i + 1,
          startCol: 1,
          endCol: line.length + 1,
          severity: "warning",
          message: `[W020] View method \`${name}\` should have a return type annotation for ABI schema generation.`,
          ruleId: "W020",
          quickFix: {
            label: "Add `-> str` return type",
            replacement: line.replace("):", ") -> str:"),
            replaceRange: { startLine: i + 1, endLine: i + 1 },
          },
        });
      }
    }
  }
  return diags;
}

// E021: Public methods cannot use *args or **kwargs
function ruleE021(codeLines: string[]): LintDiagnostic[] {
  const diags: LintDiagnostic[] = [];
  for (let i = 0; i < codeLines.length; i++) {
    const line = codeLines[i];
    if (/^\s{4}def\s+\w+\s*\(self/.test(line)) {
      const prevLine = i > 0 ? codeLines[i - 1].trim() : "";
      if (prevLine.startsWith("@gl.public")) {
        if (/\*args|\*\*kwargs/.test(line)) {
          diags.push({
            line: i + 1,
            startCol: 1,
            endCol: line.length + 1,
            severity: "error",
            message: "[E021] Public methods cannot use `*args` or `**kwargs`. GenVM ABI requires explicit parameter types.",
            ruleId: "E021",
          });
        }
      }
    }
  }
  return diags;
}

// E022: Every method must have self as first parameter
function ruleE022(codeLines: string[]): LintDiagnostic[] {
  const diags: LintDiagnostic[] = [];
  let inContractClass = false;
  for (let i = 0; i < codeLines.length; i++) {
    const line = codeLines[i];
    if (/class\s+\w+\s*\(\s*gl\.Contract\s*\)/.test(line)) { inContractClass = true; continue; }
    if (inContractClass && /^[^\s]/.test(line)) inContractClass = false;
    if (inContractClass && /^\s{4}def\s+\w+\s*\(/.test(line) && !/\(self/.test(line)) {
      const methodMatch = line.match(/def\s+(\w+)/);
      const name = methodMatch ? methodMatch[1] : "method";
      diags.push({
        line: i + 1,
        startCol: 1,
        endCol: line.length + 1,
        severity: "error",
        message: `[E022] Method \`${name}\` must have \`self\` as its first parameter.`,
        ruleId: "E022",
        quickFix: {
          label: "Add self parameter",
          replacement: line.replace(`def ${name}(`, `def ${name}(self, `).replace("(self, )", "(self)"),
          replaceRange: { startLine: i + 1, endLine: i + 1 },
        },
      });
    }
  }
  return diags;
}

// Deprecated API checks (v0.1.0 → v0.1.3 migration)
const DEPRECATED_APIS: Array<{ deprecated: string; replacement: string; pattern: RegExp }> = [
  { deprecated: "gl.get_webpage", replacement: "gl.nondet.web.render", pattern: /gl\.get_webpage\s*\(/ },
  { deprecated: "gl.exec_prompt", replacement: "gl.nondet.exec_prompt", pattern: /(?<!nondet\.)(?<![a-z_])gl\.exec_prompt\s*\(/ },
  { deprecated: "gl.ContractAt", replacement: "gl.get_contract_at", pattern: /gl\.ContractAt\s*\(/ },
  { deprecated: "@gl.eth_contract", replacement: "@gl.evm.contract_interface", pattern: /@gl\.eth_contract/ },
  { deprecated: "gl.eq_principle_strict_eq", replacement: "gl.eq_principle.strict_eq", pattern: /gl\.eq_principle_strict_eq\s*\(/ },
  { deprecated: "gl.eq_principle_prompt_comparative", replacement: "gl.eq_principle.prompt_comparative", pattern: /gl\.eq_principle_prompt_comparative\s*\(/ },
  { deprecated: "gl.advanced.rollback_immediate", replacement: "gl.advanced.user_error_immediate", pattern: /gl\.advanced\.rollback_immediate\s*\(/ },
  { deprecated: "from genlayer import Rollback", replacement: "gl.vm.UserError", pattern: /from genlayer import.*Rollback/ },
];

function ruleDeprecatedAPIs(codeLines: string[]): LintDiagnostic[] {
  const diags: LintDiagnostic[] = [];
  for (let i = 0; i < codeLines.length; i++) {
    const line = codeLines[i];
    if (line.trim().startsWith("#")) continue;
    for (const api of DEPRECATED_APIS) {
      if (api.pattern.test(line)) {
        diags.push({
          line: i + 1,
          startCol: 1,
          endCol: line.length + 1,
          severity: "warning",
          message: `\`${api.deprecated}\` is deprecated (v0.1.0 API). Use \`${api.replacement}\` instead.`,
          ruleId: "deprecated-api",
          quickFix: {
            label: `Replace with \`${api.replacement}\``,
            replacement: line.replace(api.deprecated, api.replacement),
            replaceRange: { startLine: i + 1, endLine: i + 1 },
          },
        });
      }
    }
  }
  return diags;
}

// Non-deterministic call without eq_principle (warning)
function ruleRawNondet(codeLines: string[]): LintDiagnostic[] {
  const diags: LintDiagnostic[] = [];
  const consensusRanges = getConsensusFunctionRanges(codeLines);

  for (let i = 0; i < codeLines.length; i++) {
    const line = codeLines[i];
    if (line.trim().startsWith("#")) continue;
    // Direct nondet call outside any consensus wrapper
    if (/gl\.nondet\.\w+/.test(line) && !isLineInsideRanges(i + 1, consensusRanges)) {
      diags.push({
        line: i + 1,
        startCol: 1,
        endCol: line.length + 1,
        severity: "warning",
        message: "Non-deterministic call (`gl.nondet.*`) without `gl.eq_principle` consensus wrapper. Validators may not reach consensus.",
        ruleId: "raw-nondet",
      });
    }
  }
  return diags;
}

// gl.vm.UserError check — prefer over bare exceptions
function ruleInvalidErrorClass(codeLines: string[]): LintDiagnostic[] {
  const diags: LintDiagnostic[] = [];
  for (let i = 0; i < codeLines.length; i++) {
    const line = codeLines[i];
    if (line.trim().startsWith("#")) continue;
    const match = line.match(/raise\s+(Exception|ValueError|RuntimeError|TypeError|AssertionError)\s*\(/);
    if (match) {
      diags.push({
        line: i + 1,
        startCol: line.indexOf("raise") + 1,
        endCol: line.length + 1,
        severity: "warning",
        message: `Prefer \`gl.vm.UserError\` over \`${match[1]}\` for GenVM-compatible error handling and deterministic rollback.`,
        ruleId: "prefer-user-error",
        quickFix: {
          label: "Replace with gl.vm.UserError",
          replacement: line.replace(match[1], "gl.vm.UserError"),
          replaceRange: { startLine: i + 1, endLine: i + 1 },
        },
      });
    }
  }
  return diags;
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export function lintGenVMCode(code: string): LintDiagnostic[] {
  if (!code.trim()) return [];
  const codeLines = getLines(code);
  const diagnostics: LintDiagnostic[] = [];

  // Layer 1 — Safety (fast)
  const header = ruleDependencyHeader(codeLines);
  if (header) diagnostics.push(header);

  const imp = ruleMissingImport(codeLines);
  if (imp) diagnostics.push(imp);

  diagnostics.push(...ruleForbiddenImports(codeLines));
  diagnostics.push(...ruleForbiddenCalls(codeLines));
  diagnostics.push(...ruleNondetSafety(codeLines));
  diagnostics.push(...ruleDeprecatedAPIs(codeLines));
  diagnostics.push(...ruleRawNondet(codeLines));

  // Layer 2 — Structure
  const e011 = ruleE011(codeLines);
  if (e011) diagnostics.push(e011);

  diagnostics.push(...ruleE012(codeLines));
  diagnostics.push(...ruleE013(codeLines));
  diagnostics.push(...ruleE015_E016(codeLines));
  diagnostics.push(...ruleE019(codeLines));
  diagnostics.push(...ruleW020(codeLines));
  diagnostics.push(...ruleE021(codeLines));
  diagnostics.push(...ruleE022(codeLines));
  diagnostics.push(...ruleInvalidErrorClass(codeLines));

  // Sort by line number for clean display
  return diagnostics.sort((a, b) => a.line - b.line || a.startCol - b.startCol);
}
