import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { createTool, ToolConfig } from "../../utils/base-tool.js";

// Appliance tool configurations
const applianceTools: ToolConfig[] = [
  // TODO: Add appliance-specific tools here
];

// Tool executor handlers map
const toolExecutors = new Map<string, (params: any) => Promise<any>>();

// Register all appliance tools
export async function registerApplianceTools(tools: Map<string, Tool>): Promise<void> {
  for (const config of applianceTools) {
    const tool = createTool(config);
    tools.set(config.name, tool.getToolDefinition());
    
    // Store executor for use in main handler
    toolExecutors.set(config.name, async (params) => tool.execute(params));
  }
}

// Export individual tool executors for dynamic imports
export async function execute(toolName: string, params: any): Promise<any> {
  const executor = toolExecutors.get(toolName);
  if (!executor) {
    throw new Error(`Unknown appliance tool: ${toolName}`);
  }
  return executor(params);
}