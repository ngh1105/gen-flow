/**
 * GenVM Linter — Client-side rule-based linter for GenLayer Intelligent Contracts.
 *
 * Validates generated Python code against GenVM spec and produces diagnostics
 * with quick-fix suggestions compatible with Monaco Editor.
 *
 * Rules are pure string/regex matching — no AST parsing, no backend.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface QuickFix {
  /** Label shown in Monaco lightbulb menu */
  label: string;
  /** Replacement text */
  replacement: string;
  /** If set, replaces range; otherwise inserts at diagnostic line */
  replaceRange?: { startLine: number; endLine: number };
  /** If true, inserts before the diagnostic line instead of replacing */
  insertBefore?: boolean;
}

export interface LintDiagnostic {
  line: number; // 1-indexed
  startCol: number;
  endCol: number;
  severity: "error" | "warning" | "info";
  message: string;
  ruleId: string;
  quickFix?: QuickFix;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function lines(code: string): string[] {
  return code.split("\n");
}

function findLine(codeLines: string[], pattern: RegExp | string): number {
  for (let i = 0; i < codeLines.length; i++) {
    if (typeof pattern === "string" ? codeLines[i].includes(pattern) : pattern.test(codeLines[i])) {
      return i + 1; // 1-indexed
    }
  }
  return -1;
}

function findAllLines(codeLines: string[], pattern: RegExp | string): number[] {
  const result: number[] = [];
  for (let i = 0; i < codeLines.length; i++) {
    if (typeof pattern === "string" ? codeLines[i].includes(pattern) : pattern.test(codeLines[i])) {
      result.push(i + 1);
    }
  }
  return result;
}

// Valid GenVM storage types
const VALID_STORAGE_TYPES = new Set([
  "str", "bool", "u256", "u160", "u128", "u64", "u32", "u16", "u8",
  "i256", "i128", "i64", "i32", "i16", "i8", "bigint",
  "Address", "DynArray", "TreeMap", "Array", "VecDB",
]);

// Python built-in types that are NOT valid for GenVM storage
const INVALID_STORAGE_TYPES: Record<string, string> = {
  "list": "DynArray",
  "dict": "TreeMap",
  "int": "bigint",
  "float": "# float not recommended in deterministic context",
  "List": "DynArray",
  "Dict": "TreeMap",
};

// Deprecated v0.1.0 APIs → v0.1.3 replacements
const DEPRECATED_APIS: Array<{ old: string; new: string; regex: RegExp }> = [
  { old: "gl.get_webpage", new: "gl.nondet.web.render", regex: /gl\.get_webpage\s*\(/ },
  { old: "gl.exec_prompt", new: "gl.nondet.exec_prompt", regex: /(?<!nondet\.)gl\.exec_prompt\s*\(/ },
  { old: "gl.ContractAt", new: "gl.get_contract_at", regex: /gl\.ContractAt\s*\(/ },
  { old: "@gl.eth_contract", new: "@gl.evm.contract_interface", regex: /@gl\.eth_contract/ },
  { old: "gl.eq_principle_strict_eq", new: "gl.eq_principle.strict_eq", regex: /gl\.eq_principle_strict_eq\s*\(/ },
  { old: "gl.eq_principle_prompt_comparative", new: "gl.eq_principle.prompt_comparative", regex: /gl\.eq_principle_prompt_comparative\s*\(/ },
  { old: "Rollback", new: "gl.vm.UserError", regex: /\bRollback\b/ },
  { old: "gl.advanced.rollback_immediate", new: "gl.advanced.user_error_immediate", regex: /gl\.advanced\.rollback_immediate\s*\(/ },
];

// ---------------------------------------------------------------------------
// Rule implementations
// ---------------------------------------------------------------------------

function ruleMissingImport(codeLines: string[]): LintDiagnostic | null {
  const hasImport = codeLines.some(
    (l) => l.includes("from genlayer import") || l.includes("import genlayer")
  );
  if (!hasImport) {
    return {
      line: 1,
      startCol: 1,
      endCol: 1,
      severity: "error",
      message: "Missing GenLayer import. Add `from genlayer import *`.",
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

function ruleMissingContractClass(codeLines: string[]): LintDiagnostic | null {
  const hasContract = codeLines.some((l) => /class\s+\w+\s*\(\s*gl\.Contract\s*\)/.test(l));
  if (!hasContract) {
    const lastLine = codeLines.length;
    return {
      line: lastLine,
      startCol: 1,
      endCol: 1,
      severity: "error",
      message: "No class inheriting `gl.Contract` found. GenVM requires exactly one Contract class.",
      ruleId: "missing-contract-class",
      quickFix: {
        label: "Add Contract class stub",
        replacement: "\n\nclass MyContract(gl.Contract):\n    def __init__(self):\n        pass\n",
        insertBefore: false,
      },
    };
  }
  return null;
}

function ruleMultipleContracts(codeLines: string[]): LintDiagnostic | null {
  const contractLines = findAllLines(codeLines, /class\s+\w+\s*\(\s*gl\.Contract\s*\)/);
  if (contractLines.length > 1) {
    return {
      line: contractLines[1],
      startCol: 1,
      endCol: codeLines[contractLines[1] - 1].length + 1,
      severity: "error",
      message: "Multiple Contract classes found. GenVM allows only one `gl.Contract` subclass per module.",
      ruleId: "multiple-contracts",
    };
  }
  return null;
}

function ruleMissingInit(codeLines: string[]): LintDiagnostic | null {
  const hasContract = codeLines.some((l) => /class\s+\w+\s*\(\s*gl\.Contract\s*\)/.test(l));
  if (!hasContract) return null;

  const hasInit = codeLines.some((l) => /def\s+__init__\s*\(/.test(l));
  if (!hasInit) {
    const contractLine = findLine(codeLines, /class\s+\w+\s*\(\s*gl\.Contract\s*\)/);
    return {
      line: contractLine,
      startCol: 1,
      endCol: codeLines[contractLine - 1].length + 1,
      severity: "warning",
      message: "Contract class is missing `__init__` method. Add a constructor to initialize storage fields.",
      ruleId: "missing-init",
      quickFix: {
        label: "Add __init__ method",
        replacement: codeLines[contractLine - 1] + "\n    def __init__(self):\n        pass\n",
        replaceRange: { startLine: contractLine, endLine: contractLine },
      },
    };
  }
  return null;
}

function ruleInvalidStorageType(codeLines: string[]): LintDiagnostic[] {
  const diags: LintDiagnostic[] = [];
  // Match field declarations like "    field_name: type"
  const fieldPattern = /^(\s{4}\w+)\s*:\s*(\w+)/;

  // Only check inside contract class (between class line and first def)
  let inClass = false;
  let inMethod = false;

  for (let i = 0; i < codeLines.length; i++) {
    const line = codeLines[i];
    if (/class\s+\w+\s*\(\s*gl\.Contract\s*\)/.test(line)) {
      inClass = true;
      inMethod = false;
      continue;
    }
    if (inClass && /^\s{4}def\s+/.test(line)) {
      inMethod = true;
    }
    if (inClass && !inMethod) {
      const match = line.match(fieldPattern);
      if (match) {
        const rawType = match[2];
        const replacement = INVALID_STORAGE_TYPES[rawType];
        if (replacement) {
          const col = line.indexOf(rawType) + 1;
          diags.push({
            line: i + 1,
            startCol: col,
            endCol: col + rawType.length,
            severity: "error",
            message: `\`${rawType}\` is not a valid GenVM storage type. Use \`${replacement}\` instead.`,
            ruleId: "invalid-storage-type",
            quickFix: {
              label: `Replace \`${rawType}\` with \`${replacement}\``,
              replacement: line.replace(rawType, replacement),
              replaceRange: { startLine: i + 1, endLine: i + 1 },
            },
          });
        }
      }
    }
  }
  return diags;
}

function ruleUninitializedField(codeLines: string[]): LintDiagnostic[] {
  const diags: LintDiagnostic[] = [];
  const fieldPattern = /^\s{4}(\w+)\s*:\s*\w+/;
  const fields: Array<{ name: string; line: number }> = [];

  // Collect field declarations (class body, before first def)
  let inClass = false;
  let inMethod = false;
  for (let i = 0; i < codeLines.length; i++) {
    const line = codeLines[i];
    if (/class\s+\w+\s*\(\s*gl\.Contract\s*\)/.test(line)) {
      inClass = true;
      inMethod = false;
      continue;
    }
    if (inClass && /^\s{4}def\s+/.test(line)) {
      inMethod = true;
    }
    if (inClass && !inMethod) {
      const match = line.match(fieldPattern);
      if (match) fields.push({ name: match[1], line: i + 1 });
    }
  }

  // Check if each field is initialized in __init__
  const initBody = codeLines.join("\n").match(/def __init__\([^)]*\):[^]*?(?=\n    def |\n[^\s]|$)/);
  const initText = initBody ? initBody[0] : "";

  for (const field of fields) {
    if (!initText.includes(`self.${field.name}`)) {
      diags.push({
        line: field.line,
        startCol: 1,
        endCol: codeLines[field.line - 1].length + 1,
        severity: "warning",
        message: `Storage field \`${field.name}\` is declared but not initialized in \`__init__\`.`,
        ruleId: "uninitialized-field",
      });
    }
  }
  return diags;
}

function ruleMissingDecorator(codeLines: string[]): LintDiagnostic[] {
  const diags: LintDiagnostic[] = [];
  let inContract = false;

  for (let i = 0; i < codeLines.length; i++) {
    const line = codeLines[i];
    if (/class\s+\w+\s*\(\s*gl\.Contract\s*\)/.test(line)) {
      inContract = true;
      continue;
    }
    // New top-level class/function ends contract scope
    if (inContract && /^class\s|^def\s/.test(line)) {
      inContract = false;
      continue;
    }
    if (inContract && /^\s{4}def\s+(?!__init__|_)(\w+)\s*\(self/.test(line)) {
      // Check previous line for decorator
      const prevLine = i > 0 ? codeLines[i - 1].trim() : "";
      if (!prevLine.startsWith("@gl.public") && !prevLine.startsWith("@")) {
        const methodMatch = line.match(/def\s+(\w+)/);
        const methodName = methodMatch ? methodMatch[1] : "method";
        diags.push({
          line: i + 1,
          startCol: 1,
          endCol: line.length + 1,
          severity: "warning",
          message: `Method \`${methodName}\` is missing \`@gl.public.write\` or \`@gl.public.view\` decorator.`,
          ruleId: "missing-decorator",
          quickFix: {
            label: `Add @gl.public.write decorator`,
            replacement: "    @gl.public.write\n" + line,
            replaceRange: { startLine: i + 1, endLine: i + 1 },
          },
        });
      }
    }
  }
  return diags;
}

function ruleWrongDecorator(codeLines: string[]): LintDiagnostic[] {
  const diags: LintDiagnostic[] = [];

  for (let i = 0; i < codeLines.length; i++) {
    if (codeLines[i].trim() === "@gl.public.view") {
      // Scan method body for state mutations (self.xxx = ...)
      const methodStart = i + 1;
      if (methodStart < codeLines.length) {
        // Find method body extent
        let bodyEnd = methodStart + 1;
        while (bodyEnd < codeLines.length && (codeLines[bodyEnd].startsWith("        ") || codeLines[bodyEnd].trim() === "")) {
          bodyEnd++;
        }
        const body = codeLines.slice(methodStart, bodyEnd).join("\n");
        if (/self\.\w+\s*=/.test(body) || /self\.\w+\s*\+=/.test(body) || body.includes(".append(")) {
          diags.push({
            line: i + 1,
            startCol: 1,
            endCol: codeLines[i].length + 1,
            severity: "warning",
            message: "`@gl.public.view` method modifies state. Should use `@gl.public.write` instead.",
            ruleId: "wrong-decorator",
            quickFix: {
              label: "Change to @gl.public.write",
              replacement: codeLines[i].replace("@gl.public.view", "@gl.public.write"),
              replaceRange: { startLine: i + 1, endLine: i + 1 },
            },
          });
        }
      }
    }
  }
  return diags;
}

function ruleDeprecatedAPI(codeLines: string[]): LintDiagnostic[] {
  const diags: LintDiagnostic[] = [];

  for (let i = 0; i < codeLines.length; i++) {
    const line = codeLines[i];
    // Skip comments
    if (line.trim().startsWith("#")) continue;

    for (const api of DEPRECATED_APIS) {
      if (api.regex.test(line)) {
        const col = line.indexOf(api.old) + 1;
        diags.push({
          line: i + 1,
          startCol: col > 0 ? col : 1,
          endCol: col > 0 ? col + api.old.length : line.length + 1,
          severity: "warning",
          message: `\`${api.old}\` is deprecated (v0.1.0). Use \`${api.new}\` instead.`,
          ruleId: "deprecated-api",
          quickFix: {
            label: `Replace with \`${api.new}\``,
            replacement: line.replace(api.old, api.new),
            replaceRange: { startLine: i + 1, endLine: i + 1 },
          },
        });
      }
    }
  }
  return diags;
}

function ruleRawNondet(codeLines: string[]): LintDiagnostic[] {
  const diags: LintDiagnostic[] = [];
  const code = codeLines.join("\n");
  const hasEqPrinciple = code.includes("gl.eq_principle");

  if (hasEqPrinciple) return diags; // Has consensus, fine

  for (let i = 0; i < codeLines.length; i++) {
    const line = codeLines[i];
    if (line.trim().startsWith("#")) continue;
    if (/gl\.nondet\.\w+/.test(line)) {
      diags.push({
        line: i + 1,
        startCol: 1,
        endCol: line.length + 1,
        severity: "warning",
        message: "Non-deterministic call without `gl.eq_principle` consensus. Results may not reach consensus.",
        ruleId: "raw-nondet",
      });
    }
  }
  return diags;
}

function ruleMissingReturnType(codeLines: string[]): LintDiagnostic[] {
  const diags: LintDiagnostic[] = [];

  for (let i = 0; i < codeLines.length; i++) {
    const line = codeLines[i];
    // Match public methods (decorated)
    if (/^\s{4}def\s+(?!__init__|_)\w+\s*\(self/.test(line) && !line.includes("->")) {
      const prevLine = i > 0 ? codeLines[i - 1].trim() : "";
      if (prevLine.startsWith("@gl.public")) {
        const methodMatch = line.match(/def\s+(\w+)/);
        const methodName = methodMatch ? methodMatch[1] : "method";
        diags.push({
          line: i + 1,
          startCol: 1,
          endCol: line.length + 1,
          severity: "warning",
          message: `Method \`${methodName}\` is missing return type annotation. Add \`-> str\` or appropriate type.`,
          ruleId: "missing-return-type",
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

function ruleInvalidErrorClass(codeLines: string[]): LintDiagnostic[] {
  const diags: LintDiagnostic[] = [];

  for (let i = 0; i < codeLines.length; i++) {
    const line = codeLines[i];
    if (line.trim().startsWith("#")) continue;
    // Match raise Exception/ValueError/RuntimeError etc. but not UserError
    const match = line.match(/raise\s+(Exception|ValueError|RuntimeError|TypeError)\s*\(/);
    if (match) {
      diags.push({
        line: i + 1,
        startCol: line.indexOf("raise") + 1,
        endCol: line.length + 1,
        severity: "warning",
        message: `Use \`gl.vm.UserError\` instead of \`${match[1]}\` for GenVM-compatible error handling.`,
        ruleId: "invalid-error-class",
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

function ruleFloatInDeterministic(codeLines: string[]): LintDiagnostic[] {
  const diags: LintDiagnostic[] = [];

  for (let i = 0; i < codeLines.length; i++) {
    const line = codeLines[i];
    if (line.trim().startsWith("#")) continue;
    // Match float type annotations or casts (not inside strings)
    if (/:\s*float\b/.test(line) || /\bfloat\s*\(/.test(line)) {
      diags.push({
        line: i + 1,
        startCol: 1,
        endCol: line.length + 1,
        severity: "info",
        message: "GenVM uses software float in deterministic mode — significant performance overhead. Consider using integer math.",
        ruleId: "float-in-deterministic",
      });
    }
  }
  return diags;
}

function ruleEmptyMethodBody(codeLines: string[]): LintDiagnostic[] {
  const diags: LintDiagnostic[] = [];

  for (let i = 0; i < codeLines.length; i++) {
    const line = codeLines[i];
    if (/^\s{4}def\s+(?!__init__|_)\w+/.test(line)) {
      // Check if next non-empty line is just "pass" or docstring + pass
      let bodyStart = i + 1;
      // Skip docstring
      if (bodyStart < codeLines.length && codeLines[bodyStart].trim().startsWith('"""')) {
        bodyStart++;
        while (bodyStart < codeLines.length && !codeLines[bodyStart].trim().endsWith('"""')) {
          bodyStart++;
        }
        bodyStart++;
      }
      if (bodyStart < codeLines.length && codeLines[bodyStart].trim() === "pass") {
        // Check that pass is the only statement
        const nextLine = bodyStart + 1;
        if (nextLine >= codeLines.length || /^\s{0,4}\S/.test(codeLines[nextLine]) || codeLines[nextLine].trim() === "") {
          diags.push({
            line: bodyStart + 1,
            startCol: 1,
            endCol: codeLines[bodyStart].length + 1,
            severity: "warning",
            message: "Method body is empty (`pass` only). Add implementation logic.",
            ruleId: "empty-method-body",
          });
        }
      }
    }
  }
  return diags;
}

// ---------------------------------------------------------------------------
// Main linter function
// ---------------------------------------------------------------------------

export function lintGenVMCode(code: string): LintDiagnostic[] {
  if (!code.trim()) return [];

  const codeLines = lines(code);
  const diagnostics: LintDiagnostic[] = [];

  // Category 1: Contract Structure
  const missingImport = ruleMissingImport(codeLines);
  if (missingImport) diagnostics.push(missingImport);

  const missingContract = ruleMissingContractClass(codeLines);
  if (missingContract) diagnostics.push(missingContract);

  const multipleContracts = ruleMultipleContracts(codeLines);
  if (multipleContracts) diagnostics.push(multipleContracts);

  const missingInit = ruleMissingInit(codeLines);
  if (missingInit) diagnostics.push(missingInit);

  // Category 2: Storage Types
  diagnostics.push(...ruleInvalidStorageType(codeLines));
  diagnostics.push(...ruleUninitializedField(codeLines));

  // Category 3: Decorators
  diagnostics.push(...ruleMissingDecorator(codeLines));
  diagnostics.push(...ruleWrongDecorator(codeLines));

  // Category 4: API Usage
  diagnostics.push(...ruleDeprecatedAPI(codeLines));
  diagnostics.push(...ruleRawNondet(codeLines));
  diagnostics.push(...ruleMissingReturnType(codeLines));
  diagnostics.push(...ruleInvalidErrorClass(codeLines));
  diagnostics.push(...ruleFloatInDeterministic(codeLines));
  diagnostics.push(...ruleEmptyMethodBody(codeLines));

  return diagnostics;
}
