# Claude Desktop Setup Guide for Cisco Meraki MCP Server

## Quick Start

### 1. Get Your Meraki API Key

1. Log in to the Meraki Dashboard
2. Go to **Organization > Settings**
3. Check **Enable access to the Cisco Meraki Dashboard API**
4. Generate your API key and save it securely

### 2. Build the Server

```bash
cd /path/to/cisco-meraki-mcp
npm install
npm run build
```

### 3. Configure Claude Desktop

Add this to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "meraki": {
      "command": "node",
      "args": ["/path/to/cisco-meraki-mcp/build/index.js"],
      "env": {
        "MERAKI_API_KEY": "your-40-character-api-key-here"
      }
    }
  }
}
```

### 3a. Configure Auto-Approval (Highly Recommended)

Auto-approval allows certain operations to execute without requiring manual confirmation, significantly improving your workflow while maintaining safety.

#### Method 1: Using the MCP Server's Settings File

Create a settings file in your MCP server directory:

**Location**: `/path/to/cisco-meraki-mcp/meraki-mcp-settings.json`

```json
{
  "autoApprove": {
    "enabled": true,
    "tools": {
      "all": false,              // Never auto-approve all tools
      "patterns": [              // Auto-approve tools matching these patterns
        "*_list",                // All list operations
        "*_get",                 // All get operations
        "*_overview",            // License overviews, status overviews
        "*_statuses",            // Device statuses, uplink statuses
        "*_history",             // Historical data queries
        "*_usage",               // Usage statistics
        "organization_traffic_analysis",  // Traffic analysis
        "network_traffic_get",            // Network traffic data
        "network_events_list"             // Event logs
      ],
      "specific": [              // Additional specific tools to auto-approve
        "organization_api_usage",
        "organization_config_changes"
      ],
      "exclude": [               // Never auto-approve these (overrides patterns)
        "device_reboot",         // Always require confirmation for reboots
        "network_delete"         // Always require confirmation for deletions
      ]
    },
    "readOnlyByDefault": true    // Auto-approve all read-only operations
  }
}
```

#### Method 2: Environment Variable (Alternative Location)

You can specify a custom settings file location:

```json
{
  "mcpServers": {
    "meraki": {
      "command": "node",
      "args": ["/path/to/cisco-meraki-mcp/build/index.js"],
      "env": {
        "MERAKI_API_KEY": "your-40-character-api-key-here",
        "MERAKI_MCP_SETTINGS_PATH": "/path/to/your/custom-settings.json"
      }
    }
  }
}
```

#### Understanding Auto-Approval Options

**Safe to Auto-Approve** (Read-Only Operations):
- `*_list` - Lists organizations, networks, devices, clients
- `*_get` - Gets details of specific resources
- `*_overview` - License overviews, device overviews
- `*_statuses` - Current status information
- `*_history` - Historical data (bandwidth, availability)
- `organization_traffic_analysis` - Traffic analytics
- `network_events_list` - Event logs

**Require Approval** (Write Operations):
- `*_create` - Creating new resources
- `*_update` - Modifying configurations
- `*_delete` - Removing resources
- `*_claim` - Claiming devices or licenses
- `device_reboot` - Rebooting devices
- `*_blink_leds` - Physical device actions

#### Example Configurations

**Conservative (Recommended for Production)**:
```json
{
  "autoApprove": {
    "enabled": true,
    "tools": {
      "patterns": ["*_list", "*_get"],
      "exclude": []
    },
    "readOnlyByDefault": true
  }
}
```

**Balanced (Recommended for Development)**:
```json
{
  "autoApprove": {
    "enabled": true,
    "tools": {
      "patterns": [
        "*_list", "*_get", "*_overview", 
        "*_statuses", "*_history", "*_usage"
      ],
      "specific": [
        "organization_traffic_analysis",
        "network_events_list"
      ],
      "exclude": []
    },
    "readOnlyByDefault": true
  }
}
```

**Advanced (For Power Users)**:
```json
{
  "autoApprove": {
    "enabled": true,
    "tools": {
      "patterns": ["*"],           // Auto-approve everything matching...
      "exclude": [                 // ...except these dangerous operations
        "*_delete",
        "*_create",
        "device_reboot",
        "device_remove",
        "network_firmware_upgrades_update",
        "organization_admin_create"
      ]
    },
    "readOnlyByDefault": false    // We're using patterns instead
  }
}
```

This configuration will:
- Auto-approve safe read-only operations for faster workflows
- Always require approval for potentially destructive operations
- Maintain security while improving user experience
- Allow customization based on your needs and risk tolerance

### 4. Restart Claude Desktop

Quit and restart Claude Desktop to load the new configuration.

## Verify Installation

Once configured, you can test the integration:

```
You: List my Meraki organizations
Claude: I'll list all your Meraki organizations.
[Uses the organization_list tool to retrieve and display your organizations]
```

## Common Issues

### API Key Not Working
- Ensure the API key is exactly 40 hexadecimal characters
- Verify API access is enabled for your organization
- Check that your admin account has the necessary permissions

### Server Not Loading
- Check the path in the config file is correct
- Ensure you've run `npm run build`
- Check Claude Desktop logs for errors

### Rate Limiting
The server automatically handles rate limits, but if you see errors:
- The server respects Meraki's 5 requests/second limit
- Automatic retry with exponential backoff is built-in
- For bulk operations, consider adding delays between requests

## Available Commands

Ask Claude to help with:
- "List all my Meraki organizations"
- "Show me networks in organization [ID]"
- "Check device status in network [ID]"
- "Show active clients in network [ID]"
- "Create a new network"
- "Update network settings"
- And many more!

See `examples/basic-usage.md` for detailed usage examples.