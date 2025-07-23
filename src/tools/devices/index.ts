import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { createTool, ToolConfig } from "../../utils/base-tool.js";
import { createArraySchema } from "../../utils/validators.js";

// Device tool configurations
const deviceTools: ToolConfig[] = [
  // Get Device
  {
    name: "device_get",
    description: "Return a single device",
    method: "GET",
    endpoint: (params: { serial: string }) => `/devices/${params.serial}`,
    inputSchema: z.object({
      serial: z.string().describe("The serial number of the device"),
    }),
    requiredParams: ["serial"],
  },
  
  // Update Device
  {
    name: "device_update",
    description: "Update the attributes of a device",
    method: "PUT",
    endpoint: (params: { serial: string }) => `/devices/${params.serial}`,
    inputSchema: z.object({
      serial: z.string().describe("The serial number of the device"),
      name: z.string().optional().describe("The name of the device"),
      tags: createArraySchema(z.string(), 100, "Tags for the device (max 100)"),
      lat: z.number().min(-90).max(90).optional().describe("Latitude of the device"),
      lng: z.number().min(-180).max(180).optional().describe("Longitude of the device"),
      address: z.string().optional().describe("Physical address of the device"),
      notes: z.string().optional().describe("Notes for the device"),
      moveMapMarker: z.boolean().optional().describe("Whether to move the map marker"),
      switchProfileId: z.string().optional().describe("Switch profile ID"),
      floorPlanId: z.string().optional().describe("Floor plan ID"),
    }),
    requiredParams: ["serial"],
  },
  
  // Blink Device LEDs
  {
    name: "device_blink_leds",
    description: "Blink the LEDs on a device",
    method: "POST",
    endpoint: (params: { serial: string }) => `/devices/${params.serial}/blinkLeds`,
    inputSchema: z.object({
      serial: z.string().describe("The serial number of the device"),
      duration: z.number().min(5).max(120).optional().describe("Duration in seconds (5-120)"),
      period: z.number().min(100).max(1000).optional().describe("Period in milliseconds (100-1000)"),
      duty: z.number().min(10).max(90).optional().describe("Duty cycle in percent (10-90)"),
    }),
    requiredParams: ["serial"],
  },
  
  // Get Device Clients
  {
    name: "device_clients_list",
    description: "List the clients of a device, up to a maximum of a month ago",
    method: "GET",
    endpoint: (params: { serial: string }) => `/devices/${params.serial}/clients`,
    inputSchema: z.object({
      serial: z.string().describe("The serial number of the device"),
      t0: z.string().optional().describe("The beginning of the timespan in ISO 8601 format"),
      timespan: z.coerce.number().max(2592000).optional().describe("Timespan in seconds (max 30 days)"),
    }),
    requiredParams: ["serial"],
    transformParams: (params: any) => {
      // Default to 24 hours if no timespan specified
      if (!params.timespan && !params.t0) {
        params.timespan = 86400;
      }
      return params;
    },
  },
  
  // Get Device Loss and Latency History
  {
    name: "device_loss_latency_history",
    description: "Get the uplink loss percentage and latency in milliseconds for a wired network device",
    method: "GET",
    endpoint: (params: { serial: string }) => `/devices/${params.serial}/lossAndLatencyHistory`,
    inputSchema: z.object({
      serial: z.string().describe("The serial number of the device"),
      t0: z.string().optional().describe("The beginning of the timespan in ISO 8601 format"),
      t1: z.string().optional().describe("The end of the timespan in ISO 8601 format"),
      timespan: z.coerce.number().max(31536000).optional().describe("Timespan in seconds (max 365 days)"),
      resolution: z.coerce.number().optional().describe("Resolution in seconds (60-86400)"),
      uplink: z.enum(["wan1", "wan2"]).optional().describe("The uplink to query"),
      ip: z.string().optional().describe("The destination IP to query"),
    }),
    requiredParams: ["serial"],
  },
  
  // Reboot Device
  {
    name: "device_reboot",
    description: "Reboot a device",
    method: "POST",
    endpoint: (params: { serial: string }) => `/devices/${params.serial}/reboot`,
    inputSchema: z.object({
      serial: z.string().describe("The serial number of the device"),
    }),
    requiredParams: ["serial"],
  },
  
  // Remove Device from Network
  {
    name: "device_remove",
    description: "Remove a single device from a network",
    method: "POST",
    endpoint: (params: { serial: string }) => `/devices/${params.serial}/remove`,
    inputSchema: z.object({
      serial: z.string().describe("The serial number of the device"),
    }),
    requiredParams: ["serial"],
  },
  
  // Get Device LLDP/CDP Information
  {
    name: "device_lldp_cdp",
    description: "List LLDP and CDP information for a device",
    method: "GET",
    endpoint: (params: { serial: string }) => `/devices/${params.serial}/lldpCdp`,
    inputSchema: z.object({
      serial: z.string().describe("The serial number of the device"),
      timespan: z.coerce.number().max(2592000).optional().describe("Timespan in seconds (max 30 days)"),
    }),
    requiredParams: ["serial"],
  },
  
  // Get Device Management Interface
  {
    name: "device_management_interface",
    description: "Return the management interface settings for a device",
    method: "GET",
    endpoint: (params: { serial: string }) => `/devices/${params.serial}/managementInterface`,
    inputSchema: z.object({
      serial: z.string().describe("The serial number of the device"),
    }),
    requiredParams: ["serial"],
  },
  
  // Update Device Management Interface
  {
    name: "device_management_interface_update",
    description: "Update the management interface settings for a device",
    method: "PUT",
    endpoint: (params: { serial: string }) => `/devices/${params.serial}/managementInterface`,
    inputSchema: z.object({
      serial: z.string().describe("The serial number of the device"),
      wan1: z.object({
        wanEnabled: z.enum(["enabled", "disabled", "not configured"]).optional(),
        usingStaticIp: z.boolean().optional(),
        staticIp: z.string().optional(),
        staticSubnetMask: z.string().optional(),
        staticGatewayIp: z.string().optional(),
        staticDns: createArraySchema(z.string(), 2, "DNS servers (max 2)"),
        vlan: z.number().min(1).max(4094).optional(),
      }).optional(),
      wan2: z.object({
        wanEnabled: z.enum(["enabled", "disabled", "not configured"]).optional(),
        usingStaticIp: z.boolean().optional(),
        staticIp: z.string().optional(),
        staticSubnetMask: z.string().optional(),
        staticGatewayIp: z.string().optional(),
        staticDns: createArraySchema(z.string(), 2, "DNS servers (max 2)"),
        vlan: z.number().min(1).max(4094).optional(),
      }).optional(),
    }),
    requiredParams: ["serial"],
  },
];

// Tool executor handlers map
const toolExecutors = new Map<string, (params: any) => Promise<any>>();

// Register all device tools
export async function registerDeviceTools(tools: Map<string, Tool>): Promise<void> {
  for (const config of deviceTools) {
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
    throw new Error(`Unknown device tool: ${toolName}`);
  }
  return executor(params);
}