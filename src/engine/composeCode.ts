import type { NodeData } from "@/store/useFlowStore";
import type { Node } from "@xyflow/react";
import { sanitizeClassName, sanitizeURL, escapePythonString } from "./escapeUtils";

/**
 * Dynamically compose Python code based on which nodes are on the canvas.
 * This is the "no-code compose" engine — users drag blocks, code appears.
 */
export function composeCode(
  nodeData: NodeData,
  nodes: Node[]
): string {
  const contractName = sanitizeClassName(nodeData.contractName) || "MyContract";
  const nodeTypes = new Set(nodes.map((n) => n.type));

  const hasWebFetch = nodeTypes.has("webFetchNode");
  const hasLLM = nodeTypes.has("llmPromptNode");
  const hasStorage = nodeTypes.has("storageNode");
  const hasEvent = nodeTypes.has("eventNode");
  const hasOutput = nodeTypes.has("outputNode");
  const hasPayable = nodeTypes.has("payableNode");
  const hasContractCall = nodeTypes.has("contractCallNode");
  const hasEventEmit = nodeTypes.has("eventEmitNode");
  const hasDynArray = nodeTypes.has("dynArrayNode");
  const hasTreeMap = nodeTypes.has("treeMapNode");
  const hasHTTP = nodeTypes.has("httpNode");
  const hasAccessControl = nodeTypes.has("accessControlNode");
  const hasConsensus = nodeTypes.has("consensusNode");
  const hasVecDB = nodeTypes.has("vecDBNode");
  const hasEVMBridge = nodeTypes.has("evmBridgeNode");

  // --- Build imports ---
  const imports: string[] = [
    '# { "Depends": "py-genlayer:test" }',
    "from genlayer import *",
  ];
  if (hasLLM || hasWebFetch) imports.push("import json");
  if (hasVecDB) imports.push("from genlayer_embeddings import VecDB, SentenceTransformer");

  // --- Build storage fields ---
  const fields: string[] = [];
  // result field needed by many nodes — add whenever it might be used
  const needsResult = hasStorage || hasWebFetch || hasLLM || hasHTTP || hasOutput
    || hasDynArray || hasTreeMap || hasVecDB || hasConsensus;
  if (needsResult) {
    fields.push("    result: str");
  }
  if (hasEvent || hasEventEmit) {
    fields.push("    event_count: u256");
  }
  if (hasPayable) {
    fields.push("    owner: Address");
    fields.push("    total_received: u256");
  }
  if (hasContractCall) {
    fields.push("    external_result: str");
  }
  if (hasDynArray) {
    fields.push("    items: DynArray[str]");
  }
  if (hasTreeMap) {
    fields.push("    records: TreeMap[Address, str]");
  }
  if (hasAccessControl && !hasPayable) {
    // Only add owner if payable hasn't already declared it
    fields.push("    owner: Address");
  }
  if (hasVecDB) {
    fields.push("    db: VecDB");
  }
  if (hasConsensus) {
    fields.push("    consensus_result: str");
  }

  // --- Build Event class (before contract) ---
  let eventClassCode = "";
  if (hasEventEmit) {
    eventClassCode += `\nclass ${contractName}Event(gl.Event):\n`;
    eventClassCode += `    def __init__(self, sender: Address, /):\n`;
    eventClassCode += `        ...\n\n`;
  }

  // --- Build contract interface (before contract) ---
  let interfaceCode = "";
  if (hasContractCall) {
    interfaceCode += `\n@gl.contract_interface\n`;
    interfaceCode += `class IExternalContract:\n`;
    interfaceCode += `    class View:\n`;
    interfaceCode += `        def get_data(self) -> str: ...\n`;
    interfaceCode += `    class Write:\n`;
    interfaceCode += `        def update(self, value: str) -> None: ...\n\n`;
  }
  if (hasEVMBridge) {
    interfaceCode += `\n@gl.evm.contract_interface\n`;
    interfaceCode += `class IERC20:\n`;
    interfaceCode += `    def balanceOf(self, account: Address) -> u256: ...\n`;
    interfaceCode += `    def transfer(self, to: Address, amount: u256) -> bool: ...\n\n`;
  }

  // --- Build __init__ ---
  const initLines: string[] = [];
  if (needsResult) {
    initLines.push('        self.result = ""');
  }
  if (hasEvent || hasEventEmit) {
    initLines.push("        self.event_count = u256(0)");
  }
  if (hasPayable) {
    initLines.push("        self.owner = gl.message.sender_address");
    initLines.push("        self.total_received = u256(0)");
  }
  if (hasContractCall) {
    initLines.push('        self.external_result = ""');
  }
  if (hasDynArray) {
    initLines.push("        self.items = DynArray[str]()");
  }
  if (hasTreeMap) {
    initLines.push("        self.records = TreeMap[Address, str]()");
  }
  if (hasAccessControl && !hasPayable) {
    initLines.push("        self.owner = gl.message.sender_address");
  }
  if (hasVecDB) {
    initLines.push('        model = SentenceTransformer("all-MiniLM-L6-v2")');
    initLines.push("        self.db = VecDB(model)");
  }
  if (hasConsensus) {
    initLines.push('        self.consensus_result = ""');
  }

  // --- Build write method ---
  const writeLines: string[] = [];
  let methodName = "execute";
  let methodParams = "self";
  let methodDoc = "Executes the contract logic.";
  let writeDecorator = "    @gl.public.write";

  // Payable changes the decorator
  if (hasPayable) {
    writeDecorator = "    @gl.public.write.payable";
  }

  if (hasWebFetch && hasLLM) {
    methodName = "analyze";
    methodDoc = "Fetches web data and analyzes it with AI, validated through consensus.";
    const url = sanitizeURL(nodeData.url) || "https://example.com";
    const prompt = escapePythonString(nodeData.prompt) || "Analyze the following data";

    writeLines.push("        def task() -> str:");
    writeLines.push("            # Fetch web data");
    writeLines.push(`            web_data = gl.nondet.web.render(`);
    writeLines.push(`                "${url}",`);
    writeLines.push(`                mode="text"`);
    writeLines.push(`            )`);
    writeLines.push("");
    writeLines.push("            # AI analysis");
    writeLines.push(`            analysis = gl.nondet.exec_prompt(`);
    writeLines.push(`                f"""${prompt}`);
    writeLines.push("");
    writeLines.push("Data: {web_data}");
    writeLines.push("");
    writeLines.push('Return a clear, structured result."""');
    writeLines.push("            )");
    writeLines.push("            return analysis.strip()");
    writeLines.push("");
    writeLines.push("        # Consensus validation");
    writeLines.push("        self.result = gl.eq_principle.prompt_non_comparative(");
    writeLines.push("            task,");
    writeLines.push(`            task="Analyze web data with AI",`);
    writeLines.push(`            criteria="Results should convey equivalent meaning"`);
    writeLines.push("        )");
  } else if (hasWebFetch) {
    methodName = "fetch_data";
    methodDoc = "Fetches data from a web source.";
    const url = sanitizeURL(nodeData.url) || "https://example.com";

    writeLines.push(`        web_data = gl.nondet.web.render(`);
    writeLines.push(`            "${url}",`);
    writeLines.push(`            mode="text"`);
    writeLines.push(`        )`);
    writeLines.push("        self.result = gl.eq_principle.strict_eq(");
    writeLines.push("            lambda: web_data");
    writeLines.push("        )");
  } else if (hasLLM) {
    methodName = "process";
    methodParams = hasPayable ? "self" : "self, input_data: str";
    methodDoc = "Processes input using AI with consensus validation.";
    const prompt = escapePythonString(nodeData.prompt) || "Analyze the following";

    writeLines.push("        def task() -> str:");
    writeLines.push(`            result = gl.nondet.exec_prompt(`);
    writeLines.push(`                f"""${prompt}`);
    writeLines.push("");
    if (!hasPayable) {
      writeLines.push("Input: {input_data}");
    }
    writeLines.push("");
    writeLines.push('Provide a structured response."""');
    writeLines.push("            )");
    writeLines.push("            return result.strip()");
    writeLines.push("");
    writeLines.push("        self.result = gl.eq_principle.prompt_non_comparative(");
    writeLines.push("            task,");
    writeLines.push(`            task="Process input with AI",`);
    writeLines.push(`            criteria="Results should convey equivalent meaning"`);
    writeLines.push("        )");
  } else if (hasStorage) {
    methodName = "update";
    methodParams = hasPayable ? "self" : "self, new_value: str";
    methodDoc = "Updates the stored value.";
    if (hasPayable) {
      writeLines.push('        self.result = "updated via payable"');
    } else {
      writeLines.push("        self.result = new_value");
    }
  } else {
    methodName = "execute";
    methodDoc = "Main contract method.";
    // Only write to self.result if the field was declared in storage
    if (needsResult) {
      writeLines.push('        self.result = "executed"');
    }
  }

  // Payable: track value
  if (hasPayable) {
    writeLines.push("");
    writeLines.push("        # Track received tokens");
    writeLines.push("        self.total_received += gl.message.value");
  }

  // Contract call — real executable code with safe default
  if (hasContractCall) {
    writeLines.push("");
    writeLines.push("        # Call external contract (replace target_address with real Address)");
    writeLines.push("        # Uncomment and set target_address before deploying:");
    writeLines.push("        # external = IExternalContract(Address(b'\\x00' * 20))");
    writeLines.push("        # self.external_result = external.view().get_data()");
    writeLines.push("        self.external_result = \"[contract_call_pending]\"");
  }

  // Event emit
  if (hasEventEmit) {
    writeLines.push("");
    writeLines.push("        # Emit event");
    writeLines.push(`        ${contractName}Event(gl.message.sender_address).emit()`);
    writeLines.push("        self.event_count += u256(1)");
  } else if (hasEvent && writeLines.length > 0) {
    writeLines.push("");
    writeLines.push("        # Emit event");
    writeLines.push("        self.event_count += u256(1)");
  }

  // Access control guard
  if (hasAccessControl) {
    // Prepend guard at start of write method
    writeLines.unshift("        self._only_owner()");
    writeLines.unshift("");
  }

  // HTTP request
  if (hasHTTP && !hasWebFetch) {
    writeLines.push("");
    writeLines.push("        # HTTP request");
    const url = sanitizeURL(nodeData.url) || "https://api.example.com/data";
    writeLines.push(`        resp = gl.nondet.web.get("${url}")`);
    writeLines.push("        if resp.status == 200:");
    writeLines.push("            self.result = resp.body.decode() if resp.body else \"\"");
  }

  // DynArray operations
  if (hasDynArray) {
    writeLines.push("");
    writeLines.push("        # DynArray storage");
    writeLines.push("        self.items.append(self.result if self.result else \"entry\")");
  }

  // TreeMap operations
  if (hasTreeMap) {
    writeLines.push("");
    writeLines.push("        # TreeMap storage");
    writeLines.push("        self.records[gl.message.sender_address] = self.result if self.result else \"recorded\"");
  }

  // Custom consensus
  if (hasConsensus) {
    writeLines.push("");
    writeLines.push("        # Custom consensus");
    writeLines.push("        def leader_fn() -> str:");
    writeLines.push("            return self.result if self.result else \"leader_result\"");
    writeLines.push("");
    writeLines.push("        def validator_fn(result):");
    writeLines.push("            from genlayer.gl.vm import Return");
    writeLines.push("            if not isinstance(result, Return):");
    writeLines.push("                return False");
    writeLines.push("            return len(result.calldata) > 0");
    writeLines.push("");
    writeLines.push("        self.consensus_result = gl.vm.run_nondet(leader_fn, validator_fn)");
  }

  // VecDB operations
  if (hasVecDB) {
    writeLines.push("");
    writeLines.push("        # VecDB semantic storage");
    writeLines.push("        if self.result:");
    writeLines.push('            self.db.insert(self.result, {"text": self.result})');
  }

  // EVM Bridge (commented template)
  if (hasEVMBridge) {
    writeLines.push("");
    writeLines.push("        # EVM Bridge (configure target EVM contract)");
    writeLines.push("        # erc20 = IERC20(evm_contract_address)");
    writeLines.push("        # balance = erc20.balanceOf(gl.message.sender_address)");
  }

  // Always return to satisfy -> str annotation.
  // If needsResult, return self.result; otherwise return a safe default.
  if (needsResult) {
    writeLines.push("        return self.result");
  } else {
    writeLines.push("        return \"ok\"");
  }

  // --- Assemble ---
  let code = imports.join("\n") + "\n\n";

  // Event class (before contract)
  if (eventClassCode) code += eventClassCode;

  // Contract interface (before contract)
  if (interfaceCode) code += interfaceCode;

  code += "\n# ==========================================================\n";
  code += `# ${contractName} — GenLayer Intelligent Contract\n`;
  code += "# Generated by GenFlow Visual Builder\n";
  code += "# Template: Custom Compose\n";
  code += "# ==========================================================\n\n";
  code += `class ${contractName}(gl.Contract):\n`;

  if (fields.length > 0) {
    code += fields.join("\n") + "\n\n";
  }

  code += "    def __init__(self):\n";
  if (initLines.length > 0) {
    code += initLines.join("\n") + "\n\n";
  } else {
    code += "        pass\n\n";
  }

  code += writeDecorator + "\n";
  code += `    def ${methodName}(${methodParams}) -> str:\n`;
  code += `        """${methodDoc}"""\n`;
  code += writeLines.join("\n") + "\n\n";

  // Access control helper
  if (hasAccessControl) {
    code += "    def _only_owner(self):\n";
    code += '        """Restrict to contract owner."""\n';
    code += "        if gl.message.sender_address != self.owner:\n";
    code += '            raise gl.vm.UserError("Only owner allowed")\n\n';
  }

  // Payable: __receive__ method
  if (hasPayable) {
    code += "    @gl.public.write.payable\n";
    code += "    def __receive__(self):\n";
    code += '        """Accept plain token transfers."""\n';
    code += "        self.total_received += gl.message.value\n\n";
  }

  // View method
  if (hasOutput || hasStorage || hasWebFetch || hasLLM || hasHTTP) {
    code += "    @gl.public.view\n";
    code += `    def get_result(self) -> str:\n`;
    code += '        """Returns the current result."""\n';
    code += "        return self.result\n";
  }

  // Payable view
  if (hasPayable) {
    code += "\n    @gl.public.view\n";
    code += `    def get_balance_info(self) -> dict:\n`;
    code += '        """Returns balance and ownership info."""\n';
    code += "        return {\n";
    code += '            "owner": str(self.owner),\n';
    code += '            "total_received": self.total_received,\n';
    code += '            "contract_balance": self.balance,\n';
    code += "        }\n";
  }

  // DynArray view
  if (hasDynArray) {
    code += "\n    @gl.public.view\n";
    code += "    def get_items(self) -> list:\n";
    code += '        """Returns all items in the array."""\n';
    code += "        return list(self.items)\n";
  }

  // TreeMap view
  if (hasTreeMap) {
    code += "\n    @gl.public.view\n";
    code += "    def get_record(self, addr: Address) -> str:\n";
    code += '        """Returns record for an address."""\n';
    code += '        return self.records.get(addr, "")\n';
  }

  // VecDB view
  if (hasVecDB) {
    code += "\n    @gl.public.view\n";
    code += "    def search(self, query: str, k: i32) -> list:\n";
    code += '        """Semantic search in vector store."""\n';
    code += "        return self.db.knn(query, k)\n";
  }

  // EVM interface (before contract - if needed)
  if (hasEVMBridge) {
    // Prepend EVM interface to eventClassCode area
    code += "\n    # EVM Bridge: uncomment and configure\n";
    code += "    # @gl.evm.contract_interface\n";
    code += "    # class IERC20:\n";
    code += "    #     def balanceOf(self, account: Address) -> u256: ...\n";
    code += "    #     def transfer(self, to: Address, amount: u256) -> bool: ...\n";
  }

  return code;
}
