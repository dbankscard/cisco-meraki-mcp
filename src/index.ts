#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  Tool,
  TextContent,
  ErrorCode,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import dotenv from "dotenv";

import { registerOrganizationTools } from "./tools/organizations/index.js";
import { registerNetworkTools } from "./tools/networks/index.js";
import { registerDeviceTools } from "./tools/devices/index.js";
import { registerApplianceTools } from "./tools/appliance/index.js";
import { registerSwitchTools } from "./tools/switch/index.js";
import { registerWirelessTools } from "./tools/wireless/index.js";
import { registerCameraTools } from "./tools/camera/index.js";
import { registerSystemsManagerTools } from "./tools/systems-manager/index.js";
import { validateApiKey } from "./utils/auth.js";
import { MerakiAPIError } from "./utils/error-handler.js";

// Load environment variables
dotenv.config();

// Store registered tools
const tools = new Map<string, Tool>();

// Initialize MCP server
const server = new Server(
  {
    name: "cisco-meraki-mcp",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register all tool categories
async function registerAllTools() {
  try {
    // Validate API key is available
    validateApiKey();
    
    // Register tools from each category
    const toolRegistrations = [
      registerOrganizationTools(tools),
      registerNetworkTools(tools),
      registerDeviceTools(tools),
      registerApplianceTools(tools),
      registerSwitchTools(tools),
      registerWirelessTools(tools),
      registerCameraTools(tools),
      registerSystemsManagerTools(tools),
    ];

    await Promise.all(toolRegistrations);
    
    console.error(`Registered ${tools.size} Meraki API tools`);
  } catch (error) {
    console.error("Failed to register tools:", error);
    throw error;
  }
}

// Handle list tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: Array.from(tools.values()),
  };
});

// Handle tool execution requests
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  let { name, arguments: args } = request.params;
  
  // Clean up tool name - remove any extra spaces and normalize
  name = name.replace(/\s+/g, '').trim();
  
  // Additional cleanup for common patterns
  name = name.replace(/_{2,}/g, '_'); // Replace multiple underscores with single
  name = name.replace(/^_|_$/g, ''); // Remove leading/trailing underscores
  
  const tool = tools.get(name);
  if (!tool) {
    // Log available tools for debugging
    console.error(`Tool "${name}" not found. Available tools:`, Array.from(tools.keys()).slice(0, 10));
    throw new McpError(
      ErrorCode.MethodNotFound,
      `Tool "${name}" not found`
    );
  }

  try {
    // Import the tool handler dynamically
    const toolCategory = name.split("_")[0];
    let handler;
    
    switch (toolCategory) {
      case "organization":
        handler = await import(`./tools/organizations/index.js`);
        break;
      case "network":
        handler = await import(`./tools/networks/index.js`);
        break;
      case "device":
        handler = await import(`./tools/devices/index.js`);
        break;
      case "appliance":
        handler = await import(`./tools/appliance/index.js`);
        break;
      case "switch":
        handler = await import(`./tools/switch/index.js`);
        break;
      case "wireless":
        handler = await import(`./tools/wireless/index.js`);
        break;
      case "camera":
        handler = await import(`./tools/camera/index.js`);
        break;
      case "systemsManager":
        handler = await import(`./tools/systems-manager/index.js`);
        break;
      default:
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool category for "${name}"`
        );
    }
    
    const result = await handler.execute(name, args || {});
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result),
        } as TextContent,
      ],
    };
  } catch (error) {
    if (error instanceof MerakiAPIError) {
      throw new McpError(
        ErrorCode.InternalError,
        `Meraki API Error: ${error.message}`,
        {
          statusCode: error.statusCode,
          details: error.details,
        }
      );
    }
    
    throw new McpError(
      ErrorCode.InternalError,
      `Failed to execute tool "${name}": ${error instanceof Error ? error.message : String(error)}`
    );
  }
});

// Main server startup
async function main() {
  try {
    // Register all tools
    await registerAllTools();
    
    // Create and run the transport
    const transport = new StdioServerTransport();
    await server.connect(transport);
    
    console.error("Cisco Meraki MCP server started successfully");
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGINT", async () => {
  console.error("Shutting down Meraki MCP server...");
  await server.close();
  process.exit(0);
});

// Start the server
main().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});