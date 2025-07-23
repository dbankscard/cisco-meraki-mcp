import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { createTool, ToolConfig } from "../../utils/base-tool.js";

// Wireless tool configurations
const wirelessTools: ToolConfig[] = [
  // TODO: Add wireless-specific tools here
];

// Tool executor handlers map
const toolExecutors = new Map<string, (params: any) => Promise<any>>();

// Register all wireless tools
export async function registerWirelessTools(tools: Map<string, Tool>): Promise<void> {
  for (const config of wirelessTools) {
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
    throw new Error(`Unknown wireless tool: ${toolName}`);
  }
  return executor(params);
}