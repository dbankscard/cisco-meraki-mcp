# Cisco Meraki MCP Server

[![MCP](https://img.shields.io/badge/MCP-Compatible-blue)](https://modelcontextprotocol.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Meraki API v1](https://img.shields.io/badge/Meraki%20API-v1-green)](https://developer.cisco.com/meraki/api-v1/)

A comprehensive Model Context Protocol (MCP) server that exposes all Cisco Meraki Dashboard API v1 endpoints as tools for AI assistants. Control your Meraki infrastructure through natural language with Claude, ChatGPT, or any MCP-compatible AI assistant.

## Features

- **62 Tools** - Complete coverage of Meraki Dashboard API v1
- **Natural Language Control** - Manage your network infrastructure through conversation
- **Smart Rate Limiting** - Automatic handling of API limits with exponential backoff
- **Response Optimization** - 80-95% token reduction for efficient AI interactions
- **Type Safety** - Full TypeScript with Zod validation
- **Auto-Approval** - Configurable patterns for read-only operations
- **Bearer Authentication** - Modern API v1 authentication with legacy fallback

### Supported Operations

- **Organization Management** - Networks, devices, licenses, admins  
- **Network Operations** - Clients, traffic analysis, firmware, alerts  
- **Device Control** - Status, LED control, reboots, performance metrics  
- **Analytics & Monitoring** - Bandwidth usage, applications, API usage  

## Installation

```bash
# Clone the repository
git clone https://github.com/dbankscard/cisco-meraki-mcp.git
cd cisco-meraki-mcp

# Install dependencies
npm install

# Build the server
npm run build
```

## Configuration

### 1. Get Your Meraki API Key

1. Log into [Meraki Dashboard](https://dashboard.meraki.com)
2. Navigate to **Organization > Settings**
3. Check **Enable access to the Cisco Meraki Dashboard API**
4. Generate your API key

### 2. Set Up Authentication

```bash
# Option 1: Environment variable
export MERAKI_API_KEY="your-40-character-api-key"

# Option 2: Create .env file
echo "MERAKI_API_KEY=your-40-character-api-key" > .env
```

### Optional Configuration

```bash
# Use a different API base URL (for different regions)
export MERAKI_API_BASE_URL="https://api.meraki.com/api/v1"

# Specify custom settings file location
export MERAKI_MCP_SETTINGS_PATH="/path/to/meraki-mcp-settings.json"
```

### Auto-Approve Settings

The MCP server supports configurable auto-approval for tools, allowing certain operations to execute without user confirmation. Create a `meraki-mcp-settings.json` file:

```json
{
  "autoApprove": {
    "enabled": true,
    "tools": {
      "all": false,              // Auto-approve all tools (use with caution)
      "patterns": [              // Auto-approve tools matching these patterns
        "*_list",                // All list operations
        "*_get",                 // All get operations
        "organization_*_list",   // All organization list operations
        "network_*_get"          // All network get operations
      ],
      "specific": [              // Auto-approve specific tools
        "organization_licenses_overview",
        "network_events_list"
      ],
      "exclude": [               // Never auto-approve these tools
        "network_delete",
        "organization_admin_create"
      ]
    },
    "readOnlyByDefault": true    // Auto-approve read-only operations
  }
}
```

#### Auto-Approve Configuration Options

- **enabled**: Master switch for auto-approval functionality
- **tools.all**: Auto-approve all tools (overrides other settings)
- **tools.patterns**: Array of glob-like patterns for matching tool names
- **tools.specific**: Array of exact tool names to auto-approve
- **tools.exclude**: Array of tool names to never auto-approve
- **readOnlyByDefault**: Automatically approve read-only operations (get, list, show, etc.)

**For detailed auto-approval setup instructions and example configurations, see [CLAUDE_DESKTOP_SETUP.md](CLAUDE_DESKTOP_SETUP.md#3a-configure-auto-approval-highly-recommended)**

#### Settings File Locations (in order of precedence)

1. Path specified in `MERAKI_MCP_SETTINGS_PATH` environment variable
2. `meraki-mcp-settings.json` in current working directory
3. `.meraki-mcp-settings.json` in current working directory
4. `meraki-mcp-settings.json` in the MCP server directory

## Quick Start

### Running with Claude Desktop

1. Open Claude Desktop settings
2. Add to your MCP servers configuration:

```json
{
  "mcpServers": {
    "meraki": {
      "command": "node",
      "args": ["/path/to/cisco-meraki-mcp/build/index.js"],
      "env": {
        "MERAKI_API_KEY": "your-api-key"
      }
    }
  }
}
```

3. Restart Claude Desktop
4. Look for the wrench icon to confirm MCP is connected

### Development Mode

```bash
npm run dev
```

### Testing with MCP Inspector

```bash
npm run inspector
```

## Available Tools

### Organization Tools (26 tools)

- `organization_list` - List all organizations
- `organization_get` - Get organization details
- `organization_update` - Update organization settings
- `organization_networks_list` - List networks in an organization
- `organization_network_create` - Create a new network
- `organization_devices_list` - List all devices
- `organization_devices_statuses` - Get device statuses
- `organization_devices_availabilities` - Get device availability history
- `organization_licenses_list` - List licenses
- `organization_licenses_overview` - Get license overview
- `organization_license_claim` - Claim licenses
- `organization_admins_list` - List administrators
- `organization_admin_create` - Create administrator
- `organization_inventory_devices` - Get inventory devices
- `organization_inventory_claim` - Claim inventory
- `organization_uplinks_statuses` - Get uplink statuses
- `organization_networks_combine` - Combine multiple networks

**Analytics Tools:**
- `organization_traffic_analysis` - Top bandwidth consumers
- `organization_clients_bandwidth_usage` - Bandwidth usage history
- `organization_api_usage` - API request monitoring
- `organization_config_changes` - Configuration change tracking
- `organization_device_statuses_overview` - Device health overview
- `organization_security_events` - Security event logs (aggregated from all networks)
- `organization_top_networks_by_status` - Top networks by health status
- `organization_devices_availability_history` - Device uptime tracking

### Network Tools (19 tools)

- `network_get` - Get network details
- `network_update` - Update network settings
- `network_delete` - Delete a network
- `network_clients_list` - List network clients
- `network_client_get` - Get client details
- `network_devices_list` - List network devices
- `network_devices_claim` - Claim devices
- `network_device_remove` - Remove device
- `network_traffic_get` - Get traffic analysis
- `network_events_list` - List events
- `network_firmware_upgrades_get` - Get firmware info
- `network_firmware_upgrades_update` - Update firmware settings
- `network_settings_get` - Get network settings
- `network_settings_update` - Update network settings
- `network_alerts_settings_get` - Get alert settings
- `network_alerts_settings_update` - Update alert settings
- `network_split` - Split network
- `network_combine` - Combine networks
- `network_bind` - Bind to template
- `network_unbind` - Unbind from template

### Device Tools (10 tools)

- `device_get` - Get device details
- `device_update` - Update device attributes
- `device_blink_leds` - Blink LEDs for identification
- `device_clients_list` - List clients connected to device
- `device_loss_latency_history` - Uplink performance metrics
- `device_reboot` - Reboot a device
- `device_remove` - Remove device from network
- `device_lldp_cdp` - Get LLDP/CDP information
- `device_management_interface` - Get management settings
- `device_management_interface_update` - Update management settings

### Coming Soon

- Appliance (MX) specific tools
- Switch (MS) specific tools
- Wireless (MR) specific tools
- Camera (MV) tools
- Systems Manager tools
- Insight tools
- Sensor tools

## Example Conversations

Ask your AI assistant natural language questions:

### Organization Management
```
"What Meraki organizations do I have access to?"
"Show me all networks in organization 12345"
"Create a new network called 'Branch Office' with MX and MS devices"
"What licenses are expiring soon?"
```

### Network Operations
```
"List all clients in my network from the last 24 hours"
"What's consuming the most bandwidth?"
"Show me security events from today"
"Update the timezone for network N_12345 to America/New_York"
```

### Device Control
```
"Blink the LEDs on device Q2QN-XXXX-XXXX"
"Show me the uplink performance for the last week"
"Reboot the main office switch"
"Which clients are connected to access point Q2QN-YYYY-YYYY?"
```

### Analytics & Monitoring
```
"What are the top bandwidth consuming applications?"
"Show me API usage patterns for the last week"
"Track configuration changes made this month"
"Which networks are using the most data?"
```

## Documentation

- [Full Capabilities Guide](docs/CAPABILITIES.md) - Complete list of all 62 tools with examples
- [Optimization Guide](docs/OPTIMIZATION_GUIDE.md) - Performance tuning and best practices
- [Claude Desktop Setup](CLAUDE_DESKTOP_SETUP.md) - Detailed setup instructions

## Security

- API keys are never logged or exposed in responses
- All communications use HTTPS
- Environment variables are validated on startup
- Input parameters are sanitized and validated
- Response data is filtered to prevent token overflow

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/cisco-meraki-mcp.git
cd cisco-meraki-mcp

# Install dependencies
npm install

# Run in development mode
npm run dev

# Run tests
npm test

# Test with MCP Inspector
npm run inspector
```

## Resources

- [Meraki Dashboard API Documentation](https://developer.cisco.com/meraki/api-v1/)
- [Model Context Protocol Documentation](https://modelcontextprotocol.io)
- [Cisco Meraki Community](https://community.meraki.com)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Cisco Meraki for the comprehensive Dashboard API
- Anthropic for the Model Context Protocol specification
- The open-source community for continued support and contributions

---

Made with love by [dbankscard](https://github.com/dbankscard)
