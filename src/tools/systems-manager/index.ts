import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { createTool, ToolConfig } from "../../utils/base-tool.js";

// Systems Manager tool configurations
const systemsManagerTools: ToolConfig[] = [
  // TODO: Add systems manager-specific tools here
];

// Tool executor handlers map
const toolExecutors = new Map<string, (params: any) => Promise<any>>();

// Register all systems manager tools
export async function registerSystemsManagerTools(tools: Map<string, Tool>): Promise<void> {
  for (const config of systemsManagerTools) {
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
    throw new Error(`Unknown systems manager tool: ${toolName}`);
  }
  return executor(params);
}