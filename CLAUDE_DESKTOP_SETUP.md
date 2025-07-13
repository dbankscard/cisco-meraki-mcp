# Claude Desktop Setup Guide for Cisco Meraki MCP Server

## Quick Start

### 1. Get Your Meraki API Key

1. Log in to the Meraki Dashboard
2. Go to **Organization > Settings**
3. Check **Enable access to the Cisco Meraki Dashboard API**
4. Generate your API key and save it securely

### 2. Build the Server

```bash
cd /Users/dwight/cisco_meraki_mcp
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
      "args": ["/Users/dwight/cisco_meraki_mcp/build/index.js"],
      "env": {
        "MERAKI_API_KEY": "your-40-character-api-key-here"
      }
    }
  }
}
```

### 3a. Optional: Configure Auto-Approval (Recommended)

To enable auto-approval for read-only operations, create a settings file:

**Create**: `/Users/dwight/cisco_meraki_mcp/meraki-mcp-settings.json`

```json
{
  "autoApprove": {
    "enabled": true,
    "tools": {
      "patterns": ["*_list", "*_get", "*_overview", "*_statuses"],
      "exclude": []
    },
    "readOnlyByDefault": true
  }
}
```

This configuration will:
- Auto-approve all read-only operations (list, get, overview, status checks)
- Require approval for write operations (create, update, delete, claim)
- Improve workflow efficiency while maintaining safety

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