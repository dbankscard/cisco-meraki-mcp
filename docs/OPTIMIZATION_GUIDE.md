# Meraki MCP Server Optimization Guide

## Issue: Conversation Length Limits

When using the Meraki MCP server, you may hit conversation length limits due to the large amount of data returned by some API endpoints, especially:
- `network_clients_list` - Can return hundreds of clients
- `organization_devices_list` - Can return all devices across the organization
- `network_events_list` - Can return thousands of events

## Solutions

### 1. **Use Pagination Parameters**

Always specify `perPage` to limit response size:

```
"Show me 10 clients in my network"
"List the first 20 devices in my organization"
"Show me the latest 5 network events"
```

The server supports these pagination parameters:
- `perPage`: Number of items to return (max: 1000, recommended: 10-50)
- `startingAfter`: Cursor for next page
- `endingBefore`: Cursor for previous page

### 2. **Use Specific Time Windows**

For time-based queries, use smaller timespans:

```
"Show me network traffic for the last 2 hours" (minimum)
"List clients from the last hour"
"Show today's events only"
```

Supported time parameters:
- `timespan`: Seconds to look back (min: 7200 for traffic)
- `t0`: ISO 8601 start time
- `t1`: ISO 8601 end time

### 3. **Filter Results**

Be specific about what you need:

```
"Show me only offline devices"
"List only wireless clients"
"Show security events only"
```

### 4. **Best Practices for Common Queries**

#### Listing Clients
```
Bad:  "Show me all clients"
Good: "Show me the top 10 clients by usage in the last hour"
```

#### Checking Devices
```
Bad:  "List all devices"
Good: "Show me offline devices in the main office"
```

#### Viewing Events
```
Bad:  "Show me all events"
Good: "Show me critical security events from today"
```

### 5. **Using Multiple Smaller Queries**

Instead of one large query, break it down:

```
1. "How many total clients are connected?"
2. "Show me the first 10 clients"
3. "Are there any clients with issues?"
```

### 6. **Summary Queries**

Ask for summaries instead of full data:

```
"Give me a count of devices by status"
"What's the total number of clients?"
"How many security events occurred today?"
```

## Configuration Updates

### Update Auto-Approval Settings

Edit `meraki-mcp-settings.json` to add response limits:

```json
{
  "autoApprove": {
    "enabled": true,
    "tools": {
      "patterns": ["*_list", "*_get", "*_statuses", "*_overview"],
      "defaultParams": {
        "*_list": {
          "perPage": 25
        },
        "network_clients_list": {
          "perPage": 10,
          "timespan": 3600
        },
        "network_events_list": {
          "perPage": 20
        },
        "organization_devices_list": {
          "perPage": 50
        }
      }
    }
  },
  "responseLimits": {
    "maxArrayLength": 100,
    "maxResponseSize": 50000,
    "truncateLongStrings": true
  }
}
```

## Quick Reference

### Recommended Parameters by Tool

| Tool | Recommended perPage | Other Parameters |
|------|-------------------|------------------|
| `network_clients_list` | 10-25 | timespan: 3600 |
| `organization_devices_list` | 25-50 | - |
| `network_events_list` | 10-20 | productType: required |
| `organization_networks_list` | 50-100 | - |
| `network_traffic_get` | N/A | timespan: 7200 (min) |

### Memory-Efficient Queries

1. **Device Status Check**
   ```
   "Show me a summary of device statuses"
   "Count devices by status type"
   ```

2. **Client Overview**
   ```
   "How many clients are connected?"
   "Show me the top 5 clients by bandwidth"
   ```

3. **Quick Health Check**
   ```
   "Are there any critical alerts?"
   "Show me any devices that are offline"
   ```

## Troubleshooting

If you still hit limits:

1. **Restart the conversation** and use more specific queries
2. **Use the MCP Inspector** to test queries with different parameters
3. **Check the response size** in the test results
4. **Adjust pagination** to return fewer results

## Future Improvements

Consider implementing:
1. Automatic response summarization for large datasets
2. Streaming responses for very large queries
3. Caching frequently requested data
4. Response compression

Remember: The goal is to get the information you need efficiently, not to retrieve all available data at once.