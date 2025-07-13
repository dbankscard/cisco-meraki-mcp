import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { createTool, ToolConfig } from "../../utils/base-tool.js";
import {
  paginationSchema,
  macAddressSchema,
  ipv4Schema,
  ipv6Schema,
  iso8601Schema,
  trafficTimespanSchema,
  timespanSchema,
  createArraySchema,
  serialsArraySchema,
} from "../../utils/validators.js";
// Type imports are included in the tool configurations

// Network tool configurations
const networkTools: ToolConfig[] = [
  // Get Network
  {
    name: "network_get",
    description: "Get detailed information about a specific network",
    method: "GET",
    endpoint: (params: { networkId: string }) => `/networks/${params.networkId}`,
    inputSchema: z.object({
      networkId: z.string().describe("The ID of the network"),
    }),
    requiredParams: ["networkId"],
  },
  
  // Update Network
  {
    name: "network_update",
    description: "Update a network's settings",
    method: "PUT",
    endpoint: (params: { networkId: string }) => `/networks/${params.networkId}`,
    inputSchema: z.object({
      networkId: z.string().describe("The ID of the network"),
      name: z.string().optional().describe("The name of the network"),
      timeZone: z.string().optional().describe("The timezone of the network"),
      tags: createArraySchema(z.string(), 100, "Tags for the network (max 100)"),
      enrollmentString: z.string().optional().describe("Enrollment string for the network"),
      notes: z.string().optional().describe("Notes for the network"),
    }),
    requiredParams: ["networkId"],
  },
  
  // Delete Network
  {
    name: "network_delete",
    description: "Delete a network",
    method: "DELETE",
    endpoint: (params: { networkId: string }) => `/networks/${params.networkId}`,
    inputSchema: z.object({
      networkId: z.string().describe("The ID of the network"),
    }),
    requiredParams: ["networkId"],
  },
  
  // List Network Clients
  {
    name: "network_clients_list",
    description: "List the clients that have used this network in the timespan",
    method: "GET",
    endpoint: (params: { networkId: string }) => `/networks/${params.networkId}/clients`,
    inputSchema: z.object({
      networkId: z.string().describe("The ID of the network"),
      t0: iso8601Schema.optional().describe("The beginning of the timespan in ISO 8601 format"),
      timespan: timespanSchema.optional(),
      ...paginationSchema,
      statuses: createArraySchema(z.enum(["Online", "Offline"]), 100, "Filter by client status"),
      ip: ipv4Schema.optional().describe("Filter by IP address"),
      ip6: ipv6Schema.optional().describe("Filter by IPv6 address"),
      ip6Local: ipv6Schema.optional().describe("Filter by link-local IPv6 address"),
      mac: macAddressSchema.optional().describe("Filter by MAC address"),
      os: z.string().optional().describe("Filter by OS"),
      pskGroup: z.string().optional().describe("Filter by PSK group"),
      description: z.string().optional().describe("Filter by description"),
      vlan: z.string().optional().describe("Filter by VLAN"),
      namedVlan: z.string().optional().describe("Filter by named VLAN"),
      recentDeviceConnections: createArraySchema(z.string(), 100, "Filter by recent device connections"),
    }),
    requiredParams: ["networkId"],
  },
  
  // Get Network Client
  {
    name: "network_client_get",
    description: "Get detailed information about a specific client",
    method: "GET",
    endpoint: (params: { networkId: string; clientId: string }) => 
      `/networks/${params.networkId}/clients/${params.clientId}`,
    inputSchema: z.object({
      networkId: z.string().describe("The ID of the network"),
      clientId: z.string().describe("The ID or MAC of the client"),
    }),
    requiredParams: ["networkId", "clientId"],
  },
  
  // List Network Devices
  {
    name: "network_devices_list",
    description: "List the devices in a network",
    method: "GET",
    endpoint: (params: { networkId: string }) => `/networks/${params.networkId}/devices`,
    inputSchema: z.object({
      networkId: z.string().describe("The ID of the network"),
    }),
    requiredParams: ["networkId"],
  },
  
  // Claim Network Devices
  {
    name: "network_devices_claim",
    description: "Claim devices into a network",
    method: "POST",
    endpoint: (params: { networkId: string }) => `/networks/${params.networkId}/devices/claim`,
    inputSchema: z.object({
      networkId: z.string().describe("The ID of the network"),
      serials: serialsArraySchema,
    }),
    requiredParams: ["networkId", "serials"],
  },
  
  // Remove Network Device
  {
    name: "network_device_remove",
    description: "Remove a single device from a network",
    method: "POST",
    endpoint: (params: { networkId: string }) => `/networks/${params.networkId}/devices/remove`,
    inputSchema: z.object({
      networkId: z.string().describe("The ID of the network"),
      serial: z.string().describe("The serial of the device to remove"),
    }),
    requiredParams: ["networkId", "serial"],
  },
  
  // Get Network Traffic
  {
    name: "network_traffic_get",
    description: "Get the traffic analysis data for a network",
    method: "GET",
    endpoint: (params: { networkId: string }) => `/networks/${params.networkId}/traffic`,
    inputSchema: z.object({
      networkId: z.string().describe("The ID of the network"),
      t0: iso8601Schema.optional().describe("The beginning of the timespan in ISO 8601 format"),
      timespan: trafficTimespanSchema.optional(),
      deviceType: z.enum([
        "wireless", "switch", "appliance", "cellularGateway"
      ]).optional().describe("Filter by device type"),
    }),
    requiredParams: ["networkId"],
    transformParams: (params: any) => {
      // The coercion is handled by z.coerce.number() in the schema
      // Just ensure default value if both timespan and t0 are not specified
      if (!params.timespan && !params.t0) {
        params.timespan = 86400; // Default to 24 hours
      }
      return params;
    },
  },
  
  // Get Network Events
  {
    name: "network_events_list",
    description: "List the events for a network",
    method: "GET",
    endpoint: (params: { networkId: string }) => `/networks/${params.networkId}/events`,
    inputSchema: z.object({
      networkId: z.string().describe("The ID of the network"),
      productType: z.enum([
        "wireless", "appliance", "switch", "systemsManager", 
        "camera", "cellularGateway", "sensor", "environmental"
      ]).describe("Filter by product type (required)"),
      includedEventTypes: createArraySchema(z.string(), 100, "Event types to include"),
      excludedEventTypes: createArraySchema(z.string(), 100, "Event types to exclude"),
      deviceMac: macAddressSchema.optional().describe("Filter by device MAC"),
      deviceSerial: z.string().optional().describe("Filter by device serial"),
      deviceName: z.string().optional().describe("Filter by device name"),
      clientIp: ipv4Schema.optional().describe("Filter by client IP"),
      clientMac: macAddressSchema.optional().describe("Filter by client MAC"),
      clientName: z.string().optional().describe("Filter by client name"),
      smDeviceMac: macAddressSchema.optional().describe("Filter by Systems Manager device MAC"),
      smDeviceName: z.string().optional().describe("Filter by Systems Manager device name"),
      ...paginationSchema,
    }),
    requiredParams: ["networkId", "productType"],
  },
  
  // Get Network Firmware Upgrades
  {
    name: "network_firmware_upgrades_get",
    description: "Get firmware upgrade information for a network",
    method: "GET",
    endpoint: (params: { networkId: string }) => `/networks/${params.networkId}/firmwareUpgrades`,
    inputSchema: z.object({
      networkId: z.string().describe("The ID of the network"),
    }),
    requiredParams: ["networkId"],
  },
  
  // Update Network Firmware Upgrades
  {
    name: "network_firmware_upgrades_update",
    description: "Update firmware upgrade settings for a network",
    method: "PUT",
    endpoint: (params: { networkId: string }) => `/networks/${params.networkId}/firmwareUpgrades`,
    inputSchema: z.object({
      networkId: z.string().describe("The ID of the network"),
      upgradeWindow: z.object({
        dayOfWeek: z.string().optional(),
        hourOfDay: z.string().optional(),
      }).optional().describe("Upgrade window settings"),
      timezone: z.string().optional().describe("Timezone for upgrade window"),
      products: z.object({
        appliance: z.object({
          participateInNextBetaRelease: z.boolean().optional(),
          nextUpgrade: z.object({
            time: iso8601Schema.optional(),
            toVersion: z.object({
              id: z.string().optional(),
            }).optional(),
          }).optional(),
        }).optional(),
        camera: z.object({
          participateInNextBetaRelease: z.boolean().optional(),
          nextUpgrade: z.object({
            time: iso8601Schema.optional(),
            toVersion: z.object({
              id: z.string().optional(),
            }).optional(),
          }).optional(),
        }).optional(),
        cellularGateway: z.object({
          participateInNextBetaRelease: z.boolean().optional(),
          nextUpgrade: z.object({
            time: iso8601Schema.optional(),
            toVersion: z.object({
              id: z.string().optional(),
            }).optional(),
          }).optional(),
        }).optional(),
        sensor: z.object({
          participateInNextBetaRelease: z.boolean().optional(),
          nextUpgrade: z.object({
            time: iso8601Schema.optional(),
            toVersion: z.object({
              id: z.string().optional(),
            }).optional(),
          }).optional(),
        }).optional(),
        switch: z.object({
          participateInNextBetaRelease: z.boolean().optional(),
          nextUpgrade: z.object({
            time: iso8601Schema.optional(),
            toVersion: z.object({
              id: z.string().optional(),
            }).optional(),
          }).optional(),
        }).optional(),
        wireless: z.object({
          participateInNextBetaRelease: z.boolean().optional(),
          nextUpgrade: z.object({
            time: iso8601Schema.optional(),
            toVersion: z.object({
              id: z.string().optional(),
            }).optional(),
          }).optional(),
        }).optional(),
      }).optional().describe("Product-specific settings"),
    }),
    requiredParams: ["networkId"],
  },
  
  // Get Network Settings
  {
    name: "network_settings_get",
    description: "Get the settings for a network",
    method: "GET",
    endpoint: (params: { networkId: string }) => `/networks/${params.networkId}/settings`,
    inputSchema: z.object({
      networkId: z.string().describe("The ID of the network"),
    }),
    requiredParams: ["networkId"],
  },
  
  // Update Network Settings
  {
    name: "network_settings_update",
    description: "Update the settings for a network",
    method: "PUT",
    endpoint: (params: { networkId: string }) => `/networks/${params.networkId}/settings`,
    inputSchema: z.object({
      networkId: z.string().describe("The ID of the network"),
      localStatusPageEnabled: z.boolean().optional().describe("Enable local status page"),
      remoteStatusPageEnabled: z.boolean().optional().describe("Enable remote status page"),
      localStatusPage: z.object({
        authentication: z.object({
          enabled: z.boolean().optional(),
          username: z.string().optional(),
          password: z.string().optional(),
        }).optional(),
      }).optional(),
      secureConnect: z.object({
        enabled: z.boolean().optional(),
      }).optional(),
      namedVlans: z.object({
        enabled: z.boolean().optional(),
      }).optional(),
      clientPrivacy: z.object({
        expireDataOlderThan: z.number().optional(),
        expireDataBefore: iso8601Schema.optional(),
      }).optional(),
      fips: z.object({
        enabled: z.boolean().optional(),
      }).optional(),
    }),
    requiredParams: ["networkId"],
  },
  
  // Get Network Alerts Settings
  {
    name: "network_alerts_settings_get",
    description: "Get the alert configuration for a network",
    method: "GET",
    endpoint: (params: { networkId: string }) => `/networks/${params.networkId}/alerts/settings`,
    inputSchema: z.object({
      networkId: z.string().describe("The ID of the network"),
    }),
    requiredParams: ["networkId"],
  },
  
  // Update Network Alerts Settings
  {
    name: "network_alerts_settings_update",
    description: "Update the alert configuration for a network",
    method: "PUT",
    endpoint: (params: { networkId: string }) => `/networks/${params.networkId}/alerts/settings`,
    inputSchema: z.object({
      networkId: z.string().describe("The ID of the network"),
      defaultDestinations: z.object({
        emails: createArraySchema(z.string(), 100, "Email addresses"),
        snmp: z.boolean().optional(),
        allAdmins: z.boolean().optional(),
        httpServerIds: createArraySchema(z.string(), 100, "HTTP server IDs"),
      }).optional(),
      alerts: createArraySchema(z.object({
        type: z.string(),
        enabled: z.boolean(),
        alertDestinations: z.object({
          emails: createArraySchema(z.string(), 100, "Email addresses"),
          snmp: z.boolean().optional(),
          allAdmins: z.boolean().optional(),
          httpServerIds: createArraySchema(z.string(), 100, "HTTP server IDs"),
        }).optional(),
        filters: z.object({
          timeout: z.number().optional(),
          threshold: z.number().optional(),
          period: z.number().optional(),
          regex: z.object({
            pattern: z.string().optional(),
          }).optional(),
        }).optional(),
      }), 100, "Alert configurations"),
      muting: z.object({
        byPortSchedules: z.object({
          enabled: z.boolean().optional(),
        }).optional(),
      }).optional(),
    }),
    requiredParams: ["networkId"],
  },
  
  // Split Network
  {
    name: "network_split",
    description: "Split a network into multiple networks",
    method: "POST",
    endpoint: (params: { networkId: string }) => `/networks/${params.networkId}/split`,
    inputSchema: z.object({
      networkId: z.string().describe("The ID of the network to split"),
    }),
    requiredParams: ["networkId"],
  },
  
  // Combine Networks - Moved to organizations as it's an org-level operation
  
  // Bind Network to Template
  {
    name: "network_bind",
    description: "Bind a network to a configuration template",
    method: "POST",
    endpoint: (params: { networkId: string }) => `/networks/${params.networkId}/bind`,
    inputSchema: z.object({
      networkId: z.string().describe("The ID of the network"),
      configTemplateId: z.string().describe("The ID of the template to bind to"),
      autoBind: z.boolean().optional().describe("Auto bind the network"),
    }),
    requiredParams: ["networkId", "configTemplateId"],
  },
  
  // Unbind Network from Template
  {
    name: "network_unbind",
    description: "Unbind a network from a configuration template",
    method: "POST",
    endpoint: (params: { networkId: string }) => `/networks/${params.networkId}/unbind`,
    inputSchema: z.object({
      networkId: z.string().describe("The ID of the network"),
      retainConfigs: z.boolean().optional().describe("Retain configs after unbinding"),
    }),
    requiredParams: ["networkId"],
  },
];

// Tool executor handlers map
const toolExecutors = new Map<string, (params: any) => Promise<any>>();

// Register all network tools
export async function registerNetworkTools(tools: Map<string, Tool>): Promise<void> {
  for (const config of networkTools) {
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
    throw new Error(`Unknown network tool: ${toolName}`);
  }
  return executor(params);
}