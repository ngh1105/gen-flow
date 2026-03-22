import { describe, it, expect } from "vitest";
import { generateCode } from "@/engine/codeGenerator";
import type { NodeData } from "@/store/useFlowStore";

const baseNodeData: NodeData = {
  contractName: "TestContract",
  url: "https://api.example.com/data",
  prompt: "Summarize the content",
  numValidators: 3,
  storageName: "items",
  storageFields: [],
  constructorArgs: [],
};

describe("generateCode — template mode", () => {
  it("substitutes CONTRACT_NAME", () => {
    const code = generateCode(baseNodeData, "simple-storage");
    expect(code).toContain("TestContract");
  });

  it("sanitizes a leading-digit contract name", () => {
    const code = generateCode({ ...baseNodeData, contractName: "123MyContract" }, "simple-storage");
    expect(code).not.toMatch(/class \d/);
  });

  it("falls back to empty string for missing template", () => {
    const code = generateCode(baseNodeData, "nonexistent-template-id");
    expect(code).toBe("# Error: Template not found");
  });

  it("escapes {} in prompt to avoid f-string parse errors", () => {
    const code = generateCode(
      { ...baseNodeData, prompt: 'Return {"score": 1}' },
      "ai-arbitrator"
    );
    // Braces should be doubled in generated code
    expect(code).toContain("{{");
  });
});

describe("generateCode — custom-compose mode", () => {
  it("generates code for initNode only", () => {
    const nodes = [{ id: "n1", type: "initNode", position: { x: 0, y: 0 }, data: {} }];
    const code = generateCode(baseNodeData, "custom-compose", nodes);
    expect(code).toContain("class TestContract(gl.Contract)");
    expect(code).toContain("from genlayer import *");
  });

  it("includes DynArray field when dynArrayNode present", () => {
    const nodes = [
      { id: "n1", type: "initNode", position: { x: 0, y: 0 }, data: {} },
      { id: "n2", type: "dynArrayNode", position: { x: 0, y: 100 }, data: {} },
    ];
    const code = generateCode(baseNodeData, "custom-compose", nodes);
    expect(code).toContain("DynArray[str]");
    expect(code).toContain("get_items");
  });

  it("includes TreeMap field and view when treeMapNode present", () => {
    const nodes = [
      { id: "n1", type: "initNode", position: { x: 0, y: 0 }, data: {} },
      { id: "n2", type: "treeMapNode", position: { x: 0, y: 100 }, data: {} },
    ];
    const code = generateCode(baseNodeData, "custom-compose", nodes);
    expect(code).toContain("TreeMap[Address, str]");
    expect(code).toContain("get_record");
  });

  it("_only_owner helper generated when accessControlNode present", () => {
    const nodes = [
      { id: "n1", type: "initNode", position: { x: 0, y: 0 }, data: {} },
      { id: "n2", type: "accessControlNode", position: { x: 0, y: 100 }, data: {} },
    ];
    const code = generateCode(baseNodeData, "custom-compose", nodes);
    expect(code).toContain("def _only_owner");
    expect(code).toContain("UserError");
  });

  it("does NOT declare owner twice when both payable and accessControl present", () => {
    const nodes = [
      { id: "n1", type: "initNode", position: { x: 0, y: 0 }, data: {} },
      { id: "n2", type: "payableNode", position: { x: 0, y: 100 }, data: {} },
      { id: "n3", type: "accessControlNode", position: { x: 0, y: 200 }, data: {} },
    ];
    const code = generateCode(baseNodeData, "custom-compose", nodes);
    const ownerDeclarations = (code.match(/owner: Address/g) || []).length;
    expect(ownerDeclarations).toBe(1);
  });

  it("method always returns str (no implicit None)", () => {
    const nodes = [
      { id: "n1", type: "initNode", position: { x: 0, y: 0 }, data: {} },
      { id: "n2", type: "payableNode", position: { x: 0, y: 100 }, data: {} },
    ];
    const code = generateCode(baseNodeData, "custom-compose", nodes);
    expect(code).toMatch(/return (self\.result|"ok"|"executed")/);
  });

  it("payable-only flow does NOT write self.result (field not declared)", () => {
    const nodes = [
      { id: "n1", type: "initNode", position: { x: 0, y: 0 }, data: {} },
      { id: "n2", type: "payableNode", position: { x: 0, y: 100 }, data: {} },
    ];
    const code = generateCode(baseNodeData, "custom-compose", nodes);
    // payable alone doesn't declare result: str, so no self.result assignment
    expect(code).not.toContain('self.result = "executed"');
    expect(code).not.toContain("result: str");
  });

  it("contractCall-only flow does NOT declare result field", () => {
    const nodes = [
      { id: "n1", type: "initNode", position: { x: 0, y: 0 }, data: {} },
      { id: "n2", type: "contractCallNode", position: { x: 0, y: 100 }, data: {} },
    ];
    const code = generateCode(baseNodeData, "custom-compose", nodes);
    // should NOT have standalone 'result: str' field, only 'external_result: str'
    expect(code).not.toMatch(/^\s+result: str$/m);
    expect(code).toContain("external_result: str");
  });

  it("keeps valid constructor args and ignores invalid names", () => {
    const nodes = [{ id: "n1", type: "initNode", position: { x: 0, y: 0 }, data: {} }];
    const code = generateCode(
      {
        ...baseNodeData,
        constructorArgs: [
          { id: "ca-1", name: "valid_name", type: "str" },
          { id: "ca-2", name: "1invalid", type: "str" },
        ],
      },
      "custom-compose",
      nodes
    );
    expect(code).toContain("def __init__(self, valid_name: str):");
    expect(code).not.toContain("1invalid:");
    expect(code).not.toContain("self.1invalid = 1invalid");
    expect(code).toContain("self.valid_name = valid_name");
  });

  it("promotes constructor args to declared storage fields", () => {
    const nodes = [{ id: "n1", type: "initNode", position: { x: 0, y: 0 }, data: {} }];
    const code = generateCode(
      {
        ...baseNodeData,
        constructorArgs: [{ id: "ca-1", name: "ephemeral", type: "str" }],
      },
      "custom-compose",
      nodes
    );

    expect(code).toContain("ephemeral: str");
    expect(code).toContain("def __init__(self, ephemeral: str):");
    expect(code).toContain("self.ephemeral = ephemeral");
  });

  it("uses storage field type as canonical when ctor arg has same name with different type", () => {
    const nodes = [{ id: "n1", type: "initNode", position: { x: 0, y: 0 }, data: {} }];
    const code = generateCode(
      {
        ...baseNodeData,
        storageFields: [{ id: "sf-1", name: "amount", type: "u256" }],
        constructorArgs: [{ id: "ca-1", name: "amount", type: "str" }],
      },
      "custom-compose",
      nodes
    );

    expect(code).toContain("amount: u256");
    expect(code).toContain("def __init__(self, amount: u256):");
    expect(code).not.toContain("def __init__(self, amount: str):");
  });

  it("does not allow reserved user field name to override generated result field", () => {
    const nodes = [
      { id: "n1", type: "initNode", position: { x: 0, y: 0 }, data: {} },
      { id: "n2", type: "storageNode", position: { x: 0, y: 100 }, data: {} },
    ];
    const code = generateCode(
      {
        ...baseNodeData,
        storageFields: [{ id: "sf-1", name: "result", type: "u256" }],
      },
      "custom-compose",
      nodes
    );
    expect(code).not.toContain("result: u256");
    expect(code).toContain("result: str");
  });
});
