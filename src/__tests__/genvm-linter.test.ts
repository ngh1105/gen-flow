import { describe, expect, it } from "vitest";
import { lintGenVMCode } from "@/engine/genvm-linter";

describe("genvm-linter raw nondet detection", () => {
  it("does not flag nondet inside a consensus task function", () => {
    const code = `# { "Depends": "py-genlayer:test" }
from genlayer import *

class MyContract(gl.Contract):
    result: str

    def __init__(self):
        self.result = ""

    @gl.public.write
    def run(self) -> str:
        def task() -> str:
            return gl.nondet.exec_prompt("safe")

        self.result = gl.eq_principle.prompt_non_comparative(
            task,
            task="Demo",
            criteria="Equivalent meaning"
        )
        return self.result
`;

    const diagnostics = lintGenVMCode(code);
    const raw = diagnostics.filter((d) => d.ruleId === "raw-nondet");
    expect(raw).toHaveLength(0);
  });

  it("still flags raw nondet outside consensus even if file contains eq_principle", () => {
    const code = `# { "Depends": "py-genlayer:test" }
from genlayer import *

class MyContract(gl.Contract):
    result: str

    def __init__(self):
        self.result = ""

    @gl.public.write
    def run(self) -> str:
        def task() -> str:
            return gl.nondet.exec_prompt("safe")

        leaked = gl.nondet.exec_prompt("unsafe")

        self.result = gl.eq_principle.prompt_non_comparative(
            task,
            task="Demo",
            criteria="Equivalent meaning"
        )
        return leaked
`;

    const diagnostics = lintGenVMCode(code);
    const raw = diagnostics.filter((d) => d.ruleId === "raw-nondet");
    expect(raw.length).toBeGreaterThan(0);
  });
});

describe("genvm-linter E015/E016 class field detection", () => {
  it("flags invalid storage field type declared after a method", () => {
    const code = `# { "Depends": "py-genlayer:test" }
from genlayer import *

class MyContract(gl.Contract):
    ok: u256

    def helper(self):
        return 1

    bad_list: list
`;

    const diagnostics = lintGenVMCode(code);
    expect(diagnostics.some((d) => d.ruleId === "E016")).toBe(true);
  });
});
