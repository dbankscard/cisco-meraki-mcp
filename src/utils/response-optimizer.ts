/**
 * Response optimizer to reduce token usage in MCP responses
 */

export interface OptimizationOptions {
  maxArrayLength?: number;
  truncateLongStrings?: boolean;
  maxStringLength?: number;
  removeNullFields?: boolean;
  compactFormat?: boolean;
}

const DEFAULT_OPTIONS: OptimizationOptions = {
  maxArrayLength: 100,
  truncateLongStrings: true,
  maxStringLength: 500,
  removeNullFields: true,
  compactFormat: true
};

export function optimizeResponse(data: any, options: OptimizationOptions = DEFAULT_OPTIONS): any {
  if (data === null || data === undefined) {
    return data;
  }

  // Handle arrays
  if (Array.isArray(data)) {
    const optimized = data.slice(0, options.maxArrayLength).map(item => optimizeResponse(item, options));
    
    // Add metadata about truncation
    if (data.length > options.maxArrayLength!) {
      return {
        data: optimized,
        _meta: {
          totalCount: data.length,
          returnedCount: optimized.length,
          truncated: true
        }
      };
    }
    
    return optimized;
  }

  // Handle objects
  if (typeof data === 'object') {
    const optimized: any = {};
    
    for (const [key, value] of Object.entries(data)) {
      // Skip null fields if requested
      if (options.removeNullFields && (value === null || value === undefined)) {
        continue;
      }
      
      // Recursively optimize nested values
      optimized[key] = optimizeResponse(value, options);
    }
    
    return optimized;
  }

  // Handle strings
  if (typeof data === 'string' && options.truncateLongStrings && data.length > options.maxStringLength!) {
    return data.substring(0, options.maxStringLength) + '... [truncated]';
  }

  return data;
}

/**
 * Create a summary for large datasets
 */
export function createSummaryResponse(data: any[], summaryFields?: string[]): any {
  if (!Array.isArray(data) || data.length === 0) {
    return data;
  }

  // For very large arrays, provide a summary instead of full data
  if (data.length > 50) {
    const summary = {
      totalCount: data.length,
      firstItems: data.slice(0, 5),
      summary: {} as any
    };

    // If we know which fields to summarize
    if (summaryFields && data[0] && typeof data[0] === 'object') {
      summaryFields.forEach(field => {
        const values = data.map(item => item[field]).filter(v => v !== undefined);
        if (values.length > 0) {
          summary.summary[field] = {
            uniqueCount: new Set(values).size,
            samples: [...new Set(values)].slice(0, 5)
          };
        }
      });
    }

    return summary;
  }

  return data;
}

/**
 * Minimize tool response size while maintaining usefulness
 */
export function formatToolResponse(data: any, toolName: string): string {
  // If data is already optimized (has meta field), return as-is
  if (data && typeof data === 'object' && (data.meta || data._meta || data._summary)) {
    return JSON.stringify(data);
  }
  
  let optimized = data;
  
  // Apply tool-specific optimizations for known large responses
  if (Array.isArray(data) && data.length > 30) {
    switch (toolName) {
      case 'network_clients_list':
        optimized = createSummaryResponse(data, ['description', 'mac', 'ip', 'vlan', 'status', 'usage']);
        break;
      
      case 'organization_devices_list':
      case 'organization_devices_statuses':
        optimized = createSummaryResponse(data, ['name', 'model', 'serial', 'status', 'networkId']);
        break;
      
      case 'organization_devices_availabilities':
        optimized = createSummaryResponse(data, ['serial', 'status', 'lastReportedAt']);
        break;
        
      case 'network_devices_list':
        optimized = createSummaryResponse(data, ['name', 'model', 'serial', 'status']);
        break;
      
      default:
        // For other large arrays, provide a generic summary
        optimized = createSummaryResponse(data);
    }
  } else if (toolName === 'network_events_list' && data.events && Array.isArray(data.events) && data.events.length > 30) {
    // Special handling for events which come in a nested structure
    optimized = {
      ...data,
      events: createSummaryResponse(data.events, ['type', 'category', 'occurredAt', 'description'])
    };
  } else {
    // For smaller responses, just apply basic optimization
    optimized = optimizeResponse(data, {
      maxArrayLength: 100,
      truncateLongStrings: true,
      maxStringLength: 500,
      removeNullFields: true,
      compactFormat: true
    });
  }
  
  // Return compact JSON (no pretty printing to save tokens)
  return JSON.stringify(optimized);
}