# Cisco Meraki MCP Server - Basic Usage Examples

This guide shows common usage patterns for the Cisco Meraki MCP server with AI assistants.

## Setup

First, ensure your Meraki API key is configured:

```bash
export MERAKI_API_KEY="your-api-key-here"
```

## Common Workflows

### 1. Organization Discovery

```
Human: List all my Meraki organizations
Assistant: I'll list all your Meraki organizations.

[Uses organization_list tool]

Here are your Meraki organizations:
1. Acme Corporation (ID: 123456)
   - API Enabled: Yes
   - Licensing Model: Per-device
   
2. Branch Office Network (ID: 789012)
   - API Enabled: Yes
   - Licensing Model: Co-term
```

### 2. Network Management

```
Human: Show me all networks in organization 123456
Assistant: I'll retrieve all networks in that organization.

[Uses organization_networks_list tool with organizationId: "123456"]

Found 5 networks in Acme Corporation:
1. HQ-Network (N_111111)
   - Products: Appliance, Switch, Wireless
   - Timezone: America/New_York
   
2. Branch-Office-1 (N_222222)
   - Products: Appliance, Wireless
   - Timezone: America/Chicago
   
3. Remote-Site-A (N_333333)
   - Products: Appliance
   - Timezone: America/Los_Angeles
```

### 3. Device Status Monitoring

```
Human: Check the status of all devices in network N_111111
Assistant: I'll check the device status for that network.

[Uses network_devices_list tool with networkId: "N_111111"]

Here are the devices in HQ-Network:
1. MX84 Security Appliance
   - Serial: Q2XX-XXXX-XXXX
   - Model: MX84
   - Status: Online
   - LAN IP: 192.168.1.1
   
2. MS225-24P Switch
   - Serial: Q2YY-YYYY-YYYY
   - Model: MS225-24P
   - Status: Online
   - LAN IP: 192.168.1.2
   
3. MR36 Access Point
   - Serial: Q2ZZ-ZZZZ-ZZZZ
   - Model: MR36
   - Status: Online
   - LAN IP: 192.168.1.10
```

### 4. Client Analytics

```
Human: Show me active clients in the HQ network from the last hour
Assistant: I'll retrieve the active clients from the last hour.

[Uses network_clients_list tool with networkId: "N_111111", timespan: 3600]

Found 47 active clients in the last hour:

Top clients by usage:
1. John's MacBook Pro
   - MAC: aa:bb:cc:dd:ee:ff
   - IP: 192.168.10.105
   - Usage: 1.2 GB sent, 3.4 GB received
   - SSID: Corporate-WiFi
   
2. Conference Room Apple TV
   - MAC: 11:22:33:44:55:66
   - IP: 192.168.10.50
   - Usage: 0.8 GB sent, 5.1 GB received
   - SSID: Corporate-WiFi
```

### 5. Configuration Updates

```
Human: Update the timezone for network N_222222 to America/Denver
Assistant: I'll update the timezone for that network.

[Uses network_update tool with networkId: "N_222222", timeZone: "America/Denver"]

Successfully updated Branch-Office-1 network:
- Timezone changed from America/Chicago to America/Denver
- All scheduled operations will now use Mountain Time
```

### 6. License Management

```
Human: Show me the license overview for organization 123456
Assistant: I'll get the license overview for your organization.

[Uses organization_licenses_overview tool with organizationId: "123456"]

License Overview for Acme Corporation:
- Total Devices: 45
- Licensed Devices: 43
- Available Licenses: 7

License Status:
- MX Appliances: 5/5 licensed (Valid until 2025-12-31)
- MS Switches: 15/15 licensed (Valid until 2025-12-31)
- MR Access Points: 23/25 licensed (2 devices need licenses)
- Systems Manager: 500 seats available

Action Required: 2 MR access points need license assignment
```

### 7. Creating Networks

```
Human: Create a new network called "Test Lab" in organization 123456 with wireless and switch products
Assistant: I'll create a new network with those specifications.

[Uses organization_network_create tool with:
- organizationId: "123456"
- name: "Test Lab"
- productTypes: ["wireless", "switch"]
- timeZone: "America/New_York"]

Successfully created new network:
- Name: Test Lab
- ID: N_444444
- Products: Wireless, Switch
- Timezone: America/New_York
- Tags: []

The network is now ready for device assignment and configuration.
```

### 8. Troubleshooting

```
Human: Check if there are any offline devices in organization 123456
Assistant: I'll check for any offline devices across your organization.

[Uses organization_devices_statuses tool with:
- organizationId: "123456"
- statuses: ["offline"]]

Found 2 offline devices:

1. Remote-Site-B MX67
   - Serial: Q2AA-AAAA-AAAA
   - Network: Remote-Site-B
   - Last seen: 2 hours ago
   - Status: Offline
   
2. Warehouse AP-5
   - Serial: Q2BB-BBBB-BBBB
   - Model: MR42
   - Network: Warehouse-Network
   - Last seen: 15 minutes ago
   - Status: Offline

Would you like me to check the device availability history or network events for more details?
```

## Advanced Usage Tips

### Filtering and Pagination

Many tools support filtering and pagination:

```
Human: Show me the first 50 wireless devices in organization 123456
Assistant: [Uses organization_devices_list with productTypes: ["wireless"], perPage: 50]
```

### Time-based Queries

Use ISO 8601 format or timespans in seconds:

```
Human: Show network events from the last 24 hours
Assistant: [Uses network_events_list with timespan: 86400]
```

### Bulk Operations

Some tools support bulk operations:

```
Human: Claim these devices into network N_111111: serial1, serial2, serial3
Assistant: [Uses network_devices_claim with serials: ["serial1", "serial2", "serial3"]]
```

## Error Handling

The MCP server provides clear error messages:

```
Human: Get details for network INVALID_ID
Assistant: I encountered an error retrieving that network:
Error: 404 Not Found - Network not found

Please verify the network ID is correct.
```

## Best Practices

1. **Use specific filters** when listing large datasets
2. **Specify time ranges** for historical data queries
3. **Check device status** before making configuration changes
4. **Verify organization/network IDs** before operations
5. **Use pagination** for large result sets