# Cisco Meraki MCP Server Capabilities

This document outlines all the questions and tasks the Meraki MCP server can help you with using its 62 available tools, including device management and analytics capabilities.

## 🏢 Organization Management

### Questions You Can Ask:
- "What Meraki organizations do I have access to?"
- "Show me details about my organization"
- "What's my organization's API status?"
- "List all networks in my organization"
- "How many devices do I have across all networks?"
- "What's the status of all my devices?"
- "Show me device availability over the last week"
- "What licenses do I have and when do they expire?"
- "Give me a licensing overview for my organization"
- "Who are the administrators in my organization?"
- "What devices are in my inventory but not yet claimed?"
- "Show me the uplink status for all my sites"

### Tasks You Can Perform:
- ✏️ Update organization name and settings
- ✏️ Create new networks
- ✏️ Claim license keys
- ✏️ Add new administrators with specific permissions
- ✏️ Claim devices from inventory
- ✏️ Combine multiple networks into one

### Example Commands:
```
"List all my Meraki organizations"
→ Uses: organization_list

"Show me details about organization ID 123456"
→ Uses: organization_get

"Create a new network called 'Branch Office 5' with MX and MS devices"
→ Uses: organization_network_create

"Add john@company.com as a read-only admin"
→ Uses: organization_admin_create

"Show me which devices are offline across all networks"
→ Uses: organization_devices_statuses (filters for offline)

"What's my license utilization?"
→ Uses: organization_licenses_overview

"Combine the Denver and Boulder networks into one Colorado network"
→ Uses: organization_networks_combine
```

## 🌐 Network Management

### Questions You Can Ask:
- "What are the details of my Main Office network?"
- "What's the timezone setting for my network?"
- "List all clients connected to my network"
- "Who's using the most bandwidth?"
- "Show me all devices in this network"
- "What traffic patterns do I see?"
- "What events happened in my network today?"
- "What firmware versions are my devices running?"
- "Should I upgrade firmware on any devices?"
- "What are my network-wide settings?"
- "What alerts are configured for this network?"

### Tasks You Can Perform:
- ✏️ Update network name, timezone, and tags
- ✏️ Delete a network
- ✏️ Claim new devices into a network
- ✏️ Remove devices from a network
- ✏️ Configure firmware upgrade schedules
- ✏️ Update network-wide settings
- ✏️ Configure alert thresholds and recipients
- ✏️ Split a network into multiple networks
- ✏️ Bind/unbind networks to configuration templates

### Example Commands:
```
"Show me details about network N_123456"
→ Uses: network_get

"List all clients in my guest network from the last 24 hours"
→ Uses: network_clients_list with timespan: 86400

"What devices are in my Seattle branch?"
→ Uses: network_devices_list

"Show me network traffic analysis for the last 2 hours"
→ Uses: network_traffic_get with timespan: 7200

"What security events occurred in my network today?"
→ Uses: network_events_list with productType: 'appliance'

"Update my network timezone to America/New_York"
→ Uses: network_update

"Configure firmware to auto-upgrade on Sundays at 2 AM"
→ Uses: network_firmware_upgrades_update

"Add the new MX84 device to my network"
→ Uses: network_devices_claim

"Split my large campus network into Building A and Building B"
→ Uses: network_split
```

## 🖥️ Device Management

### Questions You Can Ask:
- "Show me details about a specific device"
- "Which clients are connected to this access point?"
- "What's the uplink performance for this device?"
- "Show me the network topology information (LLDP/CDP)"
- "What are the management interface settings?"
- "Has this device been having connectivity issues?"

### Tasks You Can Perform:
- ✏️ Update device name, location, and tags
- ✏️ Blink device LEDs for physical identification
- ✏️ Reboot devices remotely
- ✏️ Remove devices from networks
- ✏️ Configure management interfaces
- ✏️ Monitor device performance metrics

### Example Commands:
```
"Show me information about device Q2QN-XXXX-XXXX"
→ Uses: device_get

"Help me identify the device in the server room by blinking its LEDs"
→ Uses: device_blink_leds with duration: 30

"Update the device name to 'Main Office Switch 1'"
→ Uses: device_update with name parameter

"List all clients connected to access point Q2QN-XXXX-XXXX"
→ Uses: device_clients_list

"Show me the uplink performance for the last 24 hours"
→ Uses: device_loss_latency_history with timespan: 86400

"Reboot the device Q2QN-XXXX-XXXX"
→ Uses: device_reboot

"Show me LLDP information for this switch"
→ Uses: device_lldp_cdp

"Remove device Q2QN-XXXX-XXXX from the network"
→ Uses: device_remove
```

## 📈 Advanced Analytics

### Organization-Wide Analytics:
- "What are the top bandwidth consuming clients across my organization?"
- "Show me API usage patterns for the last week"
- "What configuration changes were made recently?"
- "Show me security events across all networks"
- "Which networks have the best health status?"
- "Track device availability trends"

### Example Analytics Commands:
```
"Show me top bandwidth users in my organization"
→ Uses: organization_traffic_analysis


"Show me bandwidth usage history for all clients"
→ Uses: organization_clients_bandwidth_usage

"Track API usage for the last 30 days"
→ Uses: organization_api_usage with timespan: 2592000

"Show me all configuration changes made this week"
→ Uses: organization_config_changes with timespan: 604800

"Get a device status overview for my organization"
→ Uses: organization_device_statuses_overview

"Show me security events from the last 24 hours"
→ Uses: organization_security_events with timespan: 86400 (aggregates from all networks)

"Which networks have the best status scores?"
→ Uses: organization_top_networks_by_status

"Show me device availability changes"
→ Uses: organization_devices_availability_history
```

## 📊 Reporting & Analytics

### Network Performance Questions:
```
"What are the top applications consuming bandwidth?"
→ Uses: network_traffic_get to analyze traffic patterns

"Show me client usage patterns over the last week"
→ Uses: network_clients_list with timespan: 604800

"Which access points have the most connected clients?"
→ Uses: network_clients_list + network_devices_list for correlation

"What's the uptime percentage for my critical sites?"
→ Uses: organization_devices_availabilities

"Show me all networks with firmware upgrade available"
→ Uses: network_firmware_upgrades_get for each network
```

### Security & Compliance Questions:
```
"What security events should I investigate?"
→ Uses: network_events_list filtered by severity

"Show me all administrator activity"
→ Uses: organization_admins_list + audit logs

"Which devices haven't checked in recently?"
→ Uses: organization_devices_statuses filtered by lastReportedAt

"Are there any critical alerts I should know about?"
→ Uses: network_alerts_settings_get for configuration
```

### Inventory & Asset Management:
```
"What devices do I have in inventory not yet deployed?"
→ Uses: organization_inventory_devices

"Show me all devices by model type"
→ Uses: organization_devices_list grouped by model

"Which licenses are expiring soon?"
→ Uses: organization_licenses_list filtered by expiration

"What's the total device count per network?"
→ Uses: network_devices_list for each network
```

## 🔍 Troubleshooting Scenarios

### Client Connectivity Issues:
```
"Is client AA:BB:CC:DD:EE:FF currently connected?"
→ Uses: network_client_get

"Show me the connection history for this client"
→ Uses: network_client_get with detailed info

"What clients are having connection issues?"
→ Uses: network_clients_list filtered by connection status
```

### Network Performance Issues:
```
"What's the current bandwidth usage on my network?"
→ Uses: network_traffic_get for real-time data

"Are any of my uplinks down?"
→ Uses: organization_uplinks_statuses

"Which devices are reporting high CPU/memory usage?"
→ Uses: organization_devices_statuses with performance metrics
```

### Device Management:
```
"Which devices need firmware updates?"
→ Uses: network_firmware_upgrades_get

"Show me all offline devices"
→ Uses: organization_devices_statuses filtered by status

"What's the availability trend for my critical devices?"
→ Uses: organization_devices_availabilities
```

## 🛠️ Automation Use Cases

### Daily Operations:
```
"Generate a daily health report for all networks"
→ Combines: organization_devices_statuses, network_alerts_settings_get, 
   organization_uplinks_statuses

"Check if any licenses need renewal"
→ Uses: organization_licenses_list, organization_licenses_overview

"Audit administrator permissions"
→ Uses: organization_admins_list with permission analysis
```

### Bulk Operations:
```
"Update timezone for all California networks"
→ Uses: organization_networks_list (filter) + network_update (bulk)

"Claim all devices with serial numbers from this list"
→ Uses: organization_inventory_claim or network_devices_claim

"Configure consistent alert settings across all networks"
→ Uses: network_alerts_settings_update for each network
```

### Capacity Planning:
```
"Show me networks approaching client capacity"
→ Uses: network_clients_list to count active clients

"Which sites need additional access points?"
→ Uses: network_clients_list + device density analysis

"Predict when we'll need more licenses"
→ Uses: organization_licenses_overview + growth trends
```

## 📋 Quick Reference

### Read-Only Operations (Auto-Approved):
- All `*_list` operations
- All `*_get` operations  
- All `*_statuses` operations
- All `*_overview` operations
- All `*_history` operations
- All analytics endpoints
- `network_traffic_get`
- `network_events_list`
- `organization_devices_availabilities`
- `organization_inventory_devices`
- `device_lldp_cdp`

### Write Operations (Require Approval):
- All `*_create` operations
- All `*_update` operations
- All `*_delete` operations
- All `*_claim` operations
- All `*_reboot` operations
- `network_split`, `network_bind`, `network_unbind`
- `organization_networks_combine`
- `network_device_remove`
- `device_blink_leds`
- `device_remove`
- `device_management_interface_update`

### Common Parameters:
- **timespan**: Seconds to look back (min: 7200 for traffic)
- **perPage**: Results per page (max: 1000)
- **startingAfter**: Pagination cursor
- **endingBefore**: Pagination cursor
- **t0/t1**: ISO 8601 time range
- **productType**: Required for events (appliance, switch, wireless, etc.)

## 💡 Pro Tips

1. **Batch Similar Requests**: When checking multiple networks, use organization-level tools first
2. **Use Timespan Wisely**: Larger timespans return more data but take longer
3. **Pagination**: Use perPage and cursors for large datasets
4. **Combine Tools**: Many insights require combining multiple tool outputs
5. **Auto-Approval**: Configure patterns in settings for your common read operations

## 🚫 Limitations

- Maximum 1000 items per page for list operations
- Maximum 31 days timespan for most historical data
- Rate limit: 5 requests/second per organization
- Some operations require specific product types in the network
- Product-specific endpoints (MX, MS, MR, MV, SM) not yet implemented
- Webhook management not available
- Batch operations limited to sequential processing

---

This server provides comprehensive access to your Meraki infrastructure, enabling both monitoring and management through natural language commands. All operations respect Meraki API limits and include proper error handling.