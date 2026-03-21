import type { NodeData } from "@/store/useFlowStore";
import type { Node } from "@xyflow/react";
import { getTemplate, getDefaultTemplate } from "./templateRegistry";
import { escapePythonString, sanitizeClassName, sanitizeURL } from "./escapeUtils";
import { composeCode } from "./composeCode";

/**
 * Generate Python code by injecting user data into the active template.
 * For "custom-compose" template, dynamically builds code from canvas nodes.
 */
export function generateCode(
  nodeData: NodeData,
  templateId?: string,
  nodes?: Node[]
): string {
  const id = templateId || getDefaultTemplate().id;

  // Custom compose mode — dynamic code generation from nodes
  if (id === "custom-compose" && nodes) {
    return composeCode(nodeData, nodes);
  }

  const template = getTemplate(id);
  if (!template) return "# Error: Template not found";

  let code = template.template;

  const contractName = sanitizeClassName(nodeData.contractName);
  code = code.replaceAll("{{CONTRACT_NAME}}", contractName);

  if (template.placeholders.includes("URL")) {
    const url = sanitizeURL(nodeData.url);
    code = code.replaceAll("{{URL}}", url);
  }

  if (template.placeholders.includes("PROMPT")) {
    const prompt = escapePythonString(nodeData.prompt);
    code = code.replaceAll("{{PROMPT}}", prompt);
  }

  if (template.placeholders.includes("NUM_VALIDATORS")) {
    code = code.replaceAll("{{NUM_VALIDATORS}}", nodeData.numValidators.toString());
  }

  if (template.placeholders.includes("FIELD_NAME")) {
    const fieldName = (nodeData.storageName || "data").replace(/[^a-zA-Z0-9_]/g, "_").toLowerCase();
    code = code.replaceAll("{{FIELD_NAME}}", fieldName || "data");
  }

  return code;
}
