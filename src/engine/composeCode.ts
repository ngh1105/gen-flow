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

  // --- Helper: default init value for a GenVM type ---
  function getDefaultForType(type: string): string {
    if (type === "str") return '""';
    if (type === "bool") return "False";
    if (type === "Address") return "gl.message.sender_address";
    if (type.startsWith("u") || type.startsWith("i") || type === "bigint") return `${type}(0)`;
    if (type.startsWith("DynArray")) return `${type}()`;
    if (type.startsWith("TreeMap")) return `${type}()`;
    if (type === "VecDB") return 'VecDB(SentenceTransformer("all-MiniLM-L6-v2"))';
    return '""';
  }

  // --- Build storage fields ---
  const fields: string[] = [];
  // Track declared field names to prevent duplicates between user-defined and auto-added
  const declaredFieldNames = new Set<string>();
  // Track field types so constructor args with the same name can be forced to a single canonical type
  const declaredFieldTypes = new Map<string, string>();

  // Python reserved words + GenFlow system-reserved names — cannot be used as field/arg names
  const PYTHON_RESERVED = new Set(["False","None","True","and","as","assert","async","await",
    "break","class","continue","def","del","elif","else","except","finally","for",
    "from","global","if","import","in","is","lambda","nonlocal","not","or","pass",
    "raise","return","self","try","while","with","yield"]);
  const SYSTEM_RESERVED = new Set([
    "result","external_result","consensus_result",
    "owner","total_received","items","records","db","event_count",
  ]);
  const isValidName = (n: string) =>
    /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(n) && !PYTHON_RESERVED.has(n) && !SYSTEM_RESERVED.has(n);

  // 1. User-defined fields from InitNode (highest priority)
  for (const field of (nodeData.storageFields ?? [])) {
    const name = field.name.trim();
    if (name && isValidName(name) && !declaredFieldNames.has(name)) {
      fields.push(`    ${name}: ${field.type}`);
      declaredFieldNames.add(name);
      declaredFieldTypes.set(name, field.type);
    }
  }

  // 1.5 Constructor args with valid names become declared storage fields too.
  // This keeps UI behavior intuitive: args entered in InitNode are reflected in schema.
  const ctorArgTypeByName = new Map<string, string>();
  for (const arg of (nodeData.constructorArgs ?? [])) {
    const name = arg.name.trim();
    if (isValidName(name) && !ctorArgTypeByName.has(name)) {
      // If user defines a storage field with same name, its type is canonical for both schema + __init__ signature.
      const canonicalType = declaredFieldTypes.get(name) ?? arg.type;
      ctorArgTypeByName.set(name, canonicalType);
    }
  }
  for (const [name, type] of ctorArgTypeByName.entries()) {
    if (!declaredFieldNames.has(name)) {
      fields.push(`    ${name}: ${type}`);
      declaredFieldNames.add(name);
      declaredFieldTypes.set(name, type);
    }
  }

  // 2. Auto-added fields from node types (skip if user already declared same name)
  const needsResult = hasStorage || hasWebFetch || hasLLM || hasHTTP || hasOutput
    || hasDynArray || hasTreeMap || hasVecDB || hasConsensus;
  if (needsResult && !declaredFieldNames.has("result")) {
    fields.push("    result: str");
    declaredFieldNames.add("result");
    declaredFieldTypes.set("result", "str");
  }
  if ((hasEvent || hasEventEmit) && !declaredFieldNames.has("event_count")) {
    fields.push("    event_count: u256");
    declaredFieldNames.add("event_count");
    declaredFieldTypes.set("event_count", "u256");
  }
  if (hasPayable) {
    if (!declaredFieldNames.has("owner")) {
      fields.push("    owner: Address");
      declaredFieldNames.add("owner");
      declaredFieldTypes.set("owner", "Address");
    }
    if (!declaredFieldNames.has("total_received")) {
      fields.push("    total_received: u256");
      declaredFieldNames.add("total_received");
      declaredFieldTypes.set("total_received", "u256");
    }
  }
  if (hasContractCall && !declaredFieldNames.has("external_result")) {
    fields.push("    external_result: str");
    declaredFieldNames.add("external_result");
    declaredFieldTypes.set("external_result", "str");
  }
  if (hasDynArray && !declaredFieldNames.has("items")) {
    fields.push("    items: DynArray[str]");
    declaredFieldNames.add("items");
    declaredFieldTypes.set("items", "DynArray[str]");
  }
  if (hasTreeMap && !declaredFieldNames.has("records")) {
    fields.push("    records: TreeMap[Address, str]");
    declaredFieldNames.add("records");
    declaredFieldTypes.set("records", "TreeMap[Address, str]");
  }
  if (hasAccessControl && !hasPayable && !declaredFieldNames.has("owner")) {
    fields.push("    owner: Address");
    declaredFieldNames.add("owner");
    declaredFieldTypes.set("owner", "Address");
  }
  if (hasVecDB && !declaredFieldNames.has("db")) {
    fields.push("    db: VecDB");
    declaredFieldNames.add("db");
    declaredFieldTypes.set("db", "VecDB");
  }
  if (hasConsensus && !declaredFieldNames.has("consensus_result")) {
    fields.push("    consensus_result: str");
    declaredFieldNames.add("consensus_result");
    declaredFieldTypes.set("consensus_result", "str");
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
  // Constructor signature uses deduplicated, validated constructor args.
  const ctorArgs = Array.from(ctorArgTypeByName.entries())
    .map(([name, type]) => `${name}: ${type}`)
    .join(", ");
  const ctorSignature = ctorArgs ? `self, ${ctorArgs}` : "self";
  const initLines: string[] = [];

  // 1. User-defined field inits — only for valid, declared fields
  const userInitedNames = new Set<string>();
  for (const field of (nodeData.storageFields ?? [])) {
    const name = field.name.trim();
    // Skip invalid names — same guard as field declarations above
    if (name && isValidName(name)) {
      if (ctorArgTypeByName.has(name)) {
        initLines.push(`        self.${name} = ${name}`);
      } else {
        initLines.push(`        self.${name} = ${getDefaultForType(field.type)}`);
      }
      userInitedNames.add(name);
    }
  }

  // 2. Constructor args that aren't explicit storageFields (still valid and declared in step 1.5)
  for (const [name] of ctorArgTypeByName.entries()) {
    if (!userInitedNames.has(name)) {
      initLines.push(`        self.${name} = ${name}`);
      userInitedNames.add(name);
    }
  }

  // 3. Auto-added inits from node types (skip already inited)
  if (needsResult && !userInitedNames.has("result")) {
    initLines.push('        self.result = ""');
  }
  if ((hasEvent || hasEventEmit) && !userInitedNames.has("event_count")) {
    initLines.push("        self.event_count = u256(0)");
  }
  if (hasPayable) {
    if (!userInitedNames.has("owner")) {
      initLines.push("        self.owner = gl.message.sender_address");
    }
    if (!userInitedNames.has("total_received")) {
      initLines.push("        self.total_received = u256(0)");
    }
  }
  if (hasContractCall && !userInitedNames.has("external_result")) {
    initLines.push('        self.external_result = ""');
  }
  if (hasDynArray && !userInitedNames.has("items")) {
    initLines.push("        self.items = DynArray[str]()");
  }
  if (hasTreeMap && !userInitedNames.has("records")) {
    initLines.push("        self.records = TreeMap[Address, str]()");
  }
  if (hasAccessControl && !hasPayable && !userInitedNames.has("owner")) {
    initLines.push("        self.owner = gl.message.sender_address");
  }
  if (hasVecDB && !userInitedNames.has("db")) {
    initLines.push('        model = SentenceTransformer("all-MiniLM-L6-v2")');
    initLines.push("        self.db = VecDB(model)");
  }
  if (hasConsensus && !userInitedNames.has("consensus_result")) {
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

  code += `    def __init__(${ctorSignature}):\n`;
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
