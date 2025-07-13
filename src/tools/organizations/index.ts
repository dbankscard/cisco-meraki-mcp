import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { createTool, ToolConfig } from "../../utils/base-tool.js";
import {
  paginationSchema,
  macAddressSchema,
  macAddressArraySchema,
  serialsArraySchema,
  networkIdsArraySchema,
  iso8601Schema,
  createArraySchema,
  nameSchema,
  notesSchema,
  timezoneSchema
} from "../../utils/validators.js";
// Type imports are included in the tool configurations

// Organization tool configurations
const organizationTools: ToolConfig[] = [
  // List Organizations
  {
    name: "organization_list",
    description: "List the organizations that the user has privileges on",
    method: "GET",
    endpoint: "/organizations",
    inputSchema: z.object({}),
  },
  
  // Get Organization
  {
    name: "organization_get",
    description: "Get detailed information about a specific organization",
    method: "GET",
    endpoint: (params: { organizationId: string }) => `/organizations/${params.organizationId}`,
    inputSchema: z.object({
      organizationId: z.string().describe("The ID of the organization"),
    }),
    requiredParams: ["organizationId"],
  },
  
  // Update Organization
  {
    name: "organization_update",
    description: "Update an organization's settings",
    method: "PUT",
    endpoint: (params: { organizationId: string }) => `/organizations/${params.organizationId}`,
    inputSchema: z.object({
      organizationId: z.string().describe("The ID of the organization"),
      name: z.string().optional().describe("The name of the organization"),
      api: z.object({
        enabled: z.boolean().optional().describe("Enable API access"),
      }).optional(),
    }),
    requiredParams: ["organizationId"],
  },
  
  // List Organization Networks
  {
    name: "organization_networks_list",
    description: "List the networks that the user has privileges on in an organization",
    method: "GET",
    endpoint: (params: { organizationId: string }) => `/organizations/${params.organizationId}/networks`,
    inputSchema: z.object({
      organizationId: z.string().describe("The ID of the organization"),
      configTemplateId: z.string().optional().describe("Filter by config template ID"),
      isBoundToConfigTemplate: z.boolean().optional().describe("Filter by config template binding"),
      tags: createArraySchema(z.string(), 100, "Filter by tags (max 100)"),
      tagsFilterType: z.enum(["withAnyTags", "withAllTags"]).optional().describe("Tag filter type"),
      ...paginationSchema,
    }),
    requiredParams: ["organizationId"],
  },
  
  // Create Organization Network
  {
    name: "organization_network_create",
    description: "Create a new network in an organization",
    method: "POST",
    endpoint: (params: { organizationId: string }) => `/organizations/${params.organizationId}/networks`,
    inputSchema: z.object({
      organizationId: z.string().describe("The ID of the organization"),
      name: nameSchema.describe("The name of the new network"),
      productTypes: z.array(z.enum([
        "appliance", "switch", "wireless", "systemsManager", 
        "camera", "cellularGateway", "sensor"
      ])).describe("The product types for the new network"),
      tags: createArraySchema(z.string(), 100, "Tags for the network (max 100)"),
      timeZone: timezoneSchema.optional().describe("Timezone of the network"),
      copyFromNetworkId: z.string().optional().describe("ID of network to copy settings from"),
      notes: notesSchema.optional().describe("Notes for the network"),
    }),
    requiredParams: ["organizationId", "name", "productTypes"],
  },
  
  // List Organization Devices
  {
    name: "organization_devices_list",
    description: "List all devices in an organization",
    method: "GET",
    endpoint: (params: { organizationId: string }) => `/organizations/${params.organizationId}/devices`,
    inputSchema: z.object({
      organizationId: z.string().describe("The ID of the organization"),
      ...paginationSchema,
      configurationUpdatedAfter: iso8601Schema.optional().describe("Filter by config update time"),
      networkIds: networkIdsArraySchema.optional(),
      productTypes: createArraySchema(z.string(), 100, "Filter by product types (max 100)"),
      tags: createArraySchema(z.string(), 100, "Filter by tags (max 100)"),
      tagsFilterType: z.enum(["withAnyTags", "withAllTags"]).optional().describe("Tag filter type"),
      name: z.string().optional().describe("Filter by device name"),
      mac: macAddressSchema.optional().describe("Filter by MAC address"),
      serial: z.string().optional().describe("Filter by serial number"),
      model: z.string().optional().describe("Filter by model"),
      macs: macAddressArraySchema.optional(),
      serials: serialsArraySchema.optional(),
      sensorMetrics: createArraySchema(z.string(), 100, "Filter by sensor metrics (max 100)"),
      sensorAlertProfileIds: createArraySchema(z.string(), 100, "Filter by sensor alert profiles (max 100)"),
      models: createArraySchema(z.string(), 100, "Filter by multiple models (max 100)"),
    }),
    requiredParams: ["organizationId"],
  },
  
  // Get Organization Device Statuses
  {
    name: "organization_devices_statuses",
    description: "List the status of every Meraki device in the organization",
    method: "GET",
    endpoint: (params: { organizationId: string }) => `/organizations/${params.organizationId}/devices/statuses`,
    inputSchema: z.object({
      organizationId: z.string().describe("The ID of the organization"),
      ...paginationSchema,
      networkIds: networkIdsArraySchema.optional(),
      serials: serialsArraySchema.optional(),
      statuses: createArraySchema(z.enum(["online", "offline", "alerting", "dormant"]), 100, "Filter by statuses (max 100)"),
      productTypes: createArraySchema(z.string(), 100, "Filter by product types (max 100)"),
      models: createArraySchema(z.string(), 100, "Filter by models (max 100)"),
      tags: createArraySchema(z.string(), 100, "Filter by tags (max 100)"),
      tagsFilterType: z.enum(["withAnyTags", "withAllTags"]).optional().describe("Tag filter type"),
    }),
    requiredParams: ["organizationId"],
  },
  
  // Get Organization Device Availabilities
  {
    name: "organization_devices_availabilities",
    description: "List the availability history for devices in an organization",
    method: "GET",
    endpoint: (params: { organizationId: string }) => `/organizations/${params.organizationId}/devices/availabilities`,
    inputSchema: z.object({
      organizationId: z.string().describe("The ID of the organization"),
      ...paginationSchema,
      networkIds: networkIdsArraySchema.optional(),
      productTypes: createArraySchema(z.string(), 100, "Filter by product types (max 100)"),
      serials: serialsArraySchema.optional(),
      tags: createArraySchema(z.string(), 100, "Filter by tags (max 100)"),
      tagsFilterType: z.enum(["withAnyTags", "withAllTags"]).optional().describe("Tag filter type"),
    }),
    requiredParams: ["organizationId"],
  },
  
  // List Organization Licenses
  {
    name: "organization_licenses_list",
    description: "List all licenses in an organization",
    method: "GET",
    endpoint: (params: { organizationId: string }) => `/organizations/${params.organizationId}/licenses`,
    inputSchema: z.object({
      organizationId: z.string().describe("The ID of the organization"),
      ...paginationSchema,
      deviceSerial: z.string().optional().describe("Filter by device serial"),
      networkId: z.string().optional().describe("Filter by network ID"),
      state: z.enum([
        "active", "expired", "expiring", "unused", "unusedActive", "recentlyQueued"
      ]).optional().describe("Filter by license state"),
    }),
    requiredParams: ["organizationId"],
  },
  
  // Get Organization License Overview
  {
    name: "organization_licenses_overview",
    description: "Get an overview of the license state for an organization",
    method: "GET",
    endpoint: (params: { organizationId: string }) => `/organizations/${params.organizationId}/licenses/overview`,
    inputSchema: z.object({
      organizationId: z.string().describe("The ID of the organization"),
    }),
    requiredParams: ["organizationId"],
  },
  
  // Claim Organization License
  {
    name: "organization_license_claim",
    description: "Claim a license into an organization",
    method: "POST",
    endpoint: (params: { organizationId: string }) => `/organizations/${params.organizationId}/licenses`,
    inputSchema: z.object({
      organizationId: z.string().describe("The ID of the organization"),
      licenses: z.array(z.object({
        key: z.string().describe("The license key"),
        mode: z.enum(["addDevices", "renew"]).optional().describe("The claim mode"),
      })).min(1).max(100).describe("The licenses to claim (max 100)"),
    }),
    requiredParams: ["organizationId", "licenses"],
  },
  
  // List Organization Admins
  {
    name: "organization_admins_list",
    description: "List all dashboard administrators in an organization",
    method: "GET",
    endpoint: (params: { organizationId: string }) => `/organizations/${params.organizationId}/admins`,
    inputSchema: z.object({
      organizationId: z.string().describe("The ID of the organization"),
    }),
    requiredParams: ["organizationId"],
  },
  
  // Create Organization Admin
  {
    name: "organization_admin_create",
    description: "Create a new dashboard administrator in an organization",
    method: "POST",
    endpoint: (params: { organizationId: string }) => `/organizations/${params.organizationId}/admins`,
    inputSchema: z.object({
      organizationId: z.string().describe("The ID of the organization"),
      email: z.string().email().describe("The email of the new admin"),
      name: nameSchema.describe("The name of the new admin"),
      orgAccess: z.enum(["full", "read-only", "none"]).describe("Organization access level"),
      tags: createArraySchema(z.object({
        tag: z.string(),
        access: z.enum(["full", "read-only", "none"]),
      }), 100, "Tag-based access (max 100)"),
      networks: createArraySchema(z.object({
        id: z.string(),
        access: z.enum(["full", "read-only", "none"]),
      }), 100, "Network-specific access (max 100)"),
    }),
    requiredParams: ["organizationId", "email", "name", "orgAccess"],
  },
  
  // Get Organization Inventory Devices
  {
    name: "organization_inventory_devices",
    description: "Get inventory devices for an organization",
    method: "GET",
    endpoint: (params: { organizationId: string }) => `/organizations/${params.organizationId}/inventory/devices`,
    inputSchema: z.object({
      organizationId: z.string().describe("The ID of the organization"),
      ...paginationSchema,
      usedState: z.enum(["used", "unused"]).optional().describe("Filter by used state"),
      search: z.string().optional().describe("Search for devices"),
      macs: macAddressArraySchema.optional(),
      networkIds: networkIdsArraySchema.optional(),
      serials: serialsArraySchema.optional(),
      models: createArraySchema(z.string(), 100, "Filter by models (max 100)"),
      orderNumbers: createArraySchema(z.string(), 100, "Filter by order numbers (max 100)"),
      tags: createArraySchema(z.string(), 100, "Filter by tags (max 100)"),
      tagsFilterType: z.enum(["withAnyTags", "withAllTags"]).optional().describe("Tag filter type"),
      productTypes: createArraySchema(z.string(), 100, "Filter by product types (max 100)"),
    }),
    requiredParams: ["organizationId"],
  },
  
  // Claim Organization Inventory Device
  {
    name: "organization_inventory_claim",
    description: "Claim devices into an organization inventory",
    method: "POST",
    endpoint: (params: { organizationId: string }) => `/organizations/${params.organizationId}/inventory/claim`,
    inputSchema: z.object({
      organizationId: z.string().describe("The ID of the organization"),
      orders: createArraySchema(z.string(), 100, "Order numbers to claim (max 100)"),
      serials: serialsArraySchema.optional().describe("Serials to claim"),
      licenses: createArraySchema(z.object({
        key: z.string(),
        mode: z.enum(["addDevices", "renew"]).optional(),
      }), 100, "Licenses to claim (max 100)"),
    }),
    requiredParams: ["organizationId"],
  },
  
  // Get Organization Uplinks Statuses
  {
    name: "organization_uplinks_statuses",
    description: "List the uplink status of every device in an organization",
    method: "GET",
    endpoint: (params: { organizationId: string }) => `/organizations/${params.organizationId}/uplinks/statuses`,
    inputSchema: z.object({
      organizationId: z.string().describe("The ID of the organization"),
      ...paginationSchema,
      networkIds: networkIdsArraySchema.optional(),
      serials: serialsArraySchema.optional(),
      iccids: createArraySchema(z.string(), 100, "Filter by ICCIDs (max 100)"),
    }),
    requiredParams: ["organizationId"],
  },
  
  // Combine Organization Networks
  {
    name: "organization_networks_combine",
    description: "Combine multiple networks into a single network",
    method: "POST",
    endpoint: (params: { organizationId: string }) => `/organizations/${params.organizationId}/networks/combine`,
    inputSchema: z.object({
      organizationId: z.string().describe("The ID of the organization"),
      name: nameSchema.describe("The name of the combined network"),
      networkIds: z.array(z.string()).min(2).max(100).describe("List of network IDs to combine (max 100)"),
      enrollmentString: z.string().optional().describe("Enrollment string for the combined network"),
    }),
    requiredParams: ["organizationId", "name", "networkIds"],
  },
  
  // Analytics Endpoints
  // Organization-level Traffic Analysis
  {
    name: "organization_traffic_analysis",
    description: "Get traffic analysis data for an organization",
    method: "GET",
    endpoint: (params: { organizationId: string }) => 
      `/organizations/${params.organizationId}/summary/top/clients/byUsage`,
    inputSchema: z.object({
      organizationId: z.string().describe("The ID of the organization"),
      t0: z.string().optional().describe("The beginning of the timespan in ISO 8601 format"),
      t1: z.string().optional().describe("The end of the timespan in ISO 8601 format"),
      timespan: z.coerce.number().max(2592000).optional().describe("Timespan in seconds (max 30 days)"),
    }),
    requiredParams: ["organizationId"],
    transformParams: (params: any) => {
      if (!params.timespan && !params.t0 && !params.t1) {
        params.timespan = 86400; // Default to 24 hours
      }
      return params;
    },
  },


  // Organization Clients Bandwidth Usage
  {
    name: "organization_clients_bandwidth_usage",
    description: "Get bandwidth usage by client for an organization",
    method: "GET",
    endpoint: (params: { organizationId: string }) => 
      `/organizations/${params.organizationId}/clients/bandwidthUsageHistory`,
    inputSchema: z.object({
      organizationId: z.string().describe("The ID of the organization"),
      t0: z.string().optional().describe("The beginning of the timespan in ISO 8601 format"),
      t1: z.string().optional().describe("The end of the timespan in ISO 8601 format"),
      timespan: z.coerce.number().max(2592000).optional().describe("Timespan in seconds (max 30 days)"),
    }),
    requiredParams: ["organizationId"],
    transformParams: (params: any) => {
      if (!params.timespan && !params.t0 && !params.t1) {
        params.timespan = 86400; // Default to 24 hours
      }
      return params;
    },
  },

  // Organization API Usage
  {
    name: "organization_api_usage",
    description: "Get API request log for an organization",
    method: "GET",
    endpoint: (params: { organizationId: string }) => 
      `/organizations/${params.organizationId}/apiRequests`,
    inputSchema: z.object({
      organizationId: z.string().describe("The ID of the organization"),
      t0: z.string().optional().describe("The beginning of the timespan in ISO 8601 format"),
      t1: z.string().optional().describe("The end of the timespan in ISO 8601 format"),
      timespan: z.coerce.number().max(2592000).optional().describe("Timespan in seconds (max 30 days)"),
      perPage: z.coerce.number().min(3).max(1000).optional().describe("Number per page (3-1000)"),
      startingAfter: z.string().optional().describe("Starting after ID for pagination"),
      endingBefore: z.string().optional().describe("Ending before ID for pagination"),
      adminId: z.string().optional().describe("Filter by admin ID"),
      path: z.string().optional().describe("Filter by path"),
      method: z.enum(["GET", "PUT", "POST", "DELETE"]).optional().describe("Filter by method"),
      responseCode: z.coerce.number().optional().describe("Filter by response code"),
      sourceIp: z.string().optional().describe("Filter by source IP"),
    }),
    requiredParams: ["organizationId"],
  },

  // Organization Configuration Changes
  {
    name: "organization_config_changes",
    description: "Get configuration change log for an organization",
    method: "GET",
    endpoint: (params: { organizationId: string }) => 
      `/organizations/${params.organizationId}/configurationChanges`,
    inputSchema: z.object({
      organizationId: z.string().describe("The ID of the organization"),
      t0: z.string().optional().describe("The beginning of the timespan in ISO 8601 format"),
      t1: z.string().optional().describe("The end of the timespan in ISO 8601 format"),
      timespan: z.coerce.number().max(31536000).optional().describe("Timespan in seconds (max 365 days)"),
      perPage: z.coerce.number().min(3).max(5000).optional().describe("Number per page (3-5000)"),
      startingAfter: z.string().optional().describe("Starting after ID for pagination"),
      endingBefore: z.string().optional().describe("Ending before ID for pagination"),
      networkId: z.string().optional().describe("Filter by network ID"),
      adminId: z.string().optional().describe("Filter by admin ID"),
    }),
    requiredParams: ["organizationId"],
  },

  // Organization Device Statuses Analytics
  {
    name: "organization_device_statuses_overview",
    description: "Get device status overview for an organization",
    method: "GET",
    endpoint: (params: { organizationId: string }) => 
      `/organizations/${params.organizationId}/devices/statuses/overview`,
    inputSchema: z.object({
      organizationId: z.string().describe("The ID of the organization"),
      productTypes: createArraySchema(
        z.enum(["appliance", "camera", "cellularGateway", "sensor", "switch", "systemsManager", "wireless"]),
        10,
        "Filter by product types"
      ),
      networkIds: createArraySchema(z.string(), 100, "Filter by network IDs"),
    }),
    requiredParams: ["organizationId"],
  },

  // Organization Security Events (Composite)
  {
    name: "organization_security_events",
    description: "Get security event log for an organization by aggregating events from all networks",
    method: "COMPOSITE",
    inputSchema: z.object({
      organizationId: z.string().describe("The ID of the organization"),
      t0: z.string().optional().describe("The beginning of the timespan in ISO 8601 format"),
      t1: z.string().optional().describe("The end of the timespan in ISO 8601 format"),
      timespan: z.coerce.number().max(31536000).optional().describe("Timespan in seconds (max 365 days)"),
      perPage: z.coerce.number().min(3).max(1000).optional().describe("Number per page (3-1000)"),
      securityEventTypes: createArraySchema(z.string(), 50, "Specific security event types to include"),
    }),
    requiredParams: ["organizationId"],
    customExecutor: async (params: any, apiClient: any) => {
      // First, get all networks in the organization
      const networksResponse = await apiClient.get(`/organizations/${params.organizationId}/networks`);
      const networks = networksResponse.data;
      
      let allSecurityEvents: any[] = [];
      
      // For each network, get appliance events (where security events are typically found)
      for (const network of networks) {
        try {
          const eventParams: any = {
            networkId: network.id,
            productType: 'appliance',
            perPage: params.perPage || 100,
          };
          
          // Add time parameters if provided
          if (params.t0) eventParams.t0 = params.t0;
          if (params.t1) eventParams.t1 = params.t1;
          if (params.timespan) eventParams.timespan = params.timespan;
          
          // Add security-related event types if not specified
          if (params.securityEventTypes?.length) {
            eventParams.includedEventTypes = params.securityEventTypes;
          } else {
            // Default security event types for MX appliances
            eventParams.includedEventTypes = [
              'security_event',
              'ids_alerted',
              'content_filtering_blocked',
              'malware_blocked',
              'vpn_connectivity_change',
              'firewall_blocked',
              'amp_blocked'
            ];
          }
          
          const eventsResponse = await apiClient.get(`/networks/${network.id}/events`, { params: eventParams });
          
          // Add network info to each event
          const eventsWithNetwork = eventsResponse.data.events?.map((event: any) => ({
            ...event,
            networkId: network.id,
            networkName: network.name
          })) || [];
          
          allSecurityEvents = allSecurityEvents.concat(eventsWithNetwork);
        } catch (error) {
          // Skip networks that don't have appliances or events endpoint
          continue;
        }
      }
      
      // Sort by timestamp (most recent first)
      allSecurityEvents.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
      
      // Apply pagination if specified
      if (params.perPage) {
        allSecurityEvents = allSecurityEvents.slice(0, params.perPage);
      }
      
      return {
        events: allSecurityEvents,
        total: allSecurityEvents.length,
        organizationId: params.organizationId
      };
    },
  },

  // Organization Top Networks by Status (verified endpoint)
  {
    name: "organization_top_networks_by_status",
    description: "Get top networks by status for an organization",
    method: "GET",
    endpoint: (params: { organizationId: string }) => 
      `/organizations/${params.organizationId}/summary/top/networks/byStatus`,
    inputSchema: z.object({
      organizationId: z.string().describe("The ID of the organization"),
      t0: z.string().optional().describe("The beginning of the timespan in ISO 8601 format"),
      t1: z.string().optional().describe("The end of the timespan in ISO 8601 format"),
      timespan: z.coerce.number().max(2592000).optional().describe("Timespan in seconds (max 30 days)"),
    }),
    requiredParams: ["organizationId"],
    transformParams: (params: any) => {
      if (!params.timespan && !params.t0 && !params.t1) {
        params.timespan = 86400; // Default to 24 hours
      }
      return params;
    },
  },

  // Organization Device Availability
  {
    name: "organization_devices_availability_history",
    description: "Get device availability history for an organization",
    method: "GET",
    endpoint: (params: { organizationId: string }) => 
      `/organizations/${params.organizationId}/devices/availabilities/changeHistory`,
    inputSchema: z.object({
      organizationId: z.string().describe("The ID of the organization"),
      t0: z.string().optional().describe("The beginning of the timespan in ISO 8601 format"),
      t1: z.string().optional().describe("The end of the timespan in ISO 8601 format"),
      timespan: z.coerce.number().max(31536000).optional().describe("Timespan in seconds (max 365 days)"),
      perPage: z.coerce.number().min(3).max(1000).optional().describe("Number per page (3-1000)"),
      startingAfter: z.string().optional().describe("Starting after ID for pagination"),
      endingBefore: z.string().optional().describe("Ending before ID for pagination"),
      networkIds: createArraySchema(z.string(), 100, "Filter by network IDs"),
      productTypes: createArraySchema(
        z.enum(["appliance", "camera", "cellularGateway", "sensor", "switch", "systemsManager", "wireless"]),
        10,
        "Filter by product types"
      ),
      serials: createArraySchema(z.string(), 100, "Filter by device serials"),
      statuses: createArraySchema(z.enum(["online", "offline", "alerting", "dormant"]), 4, "Filter by status"),
    }),
    requiredParams: ["organizationId"],
  },
];

// Tool executor handlers map
const toolExecutors = new Map<string, (params: any) => Promise<any>>();

// Register all organization tools
export async function registerOrganizationTools(tools: Map<string, Tool>): Promise<void> {
  for (const config of organizationTools) {
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
    throw new Error(`Unknown organization tool: ${toolName}`);
  }
  return executor(params);
}