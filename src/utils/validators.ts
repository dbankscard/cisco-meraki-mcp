import { z } from "zod";

/**
 * Common validators for Meraki API parameters
 */

// Network addressing validators
export const macAddressSchema = z.string().regex(
  /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/,
  "Invalid MAC address format (expected: XX:XX:XX:XX:XX:XX or XX-XX-XX-XX-XX-XX)"
);

export const ipv4Schema = z.string().ip({ 
  version: "v4",
  message: "Invalid IPv4 address format" 
});

export const ipv6Schema = z.string().ip({ 
  version: "v6",
  message: "Invalid IPv6 address format" 
});

// Time validators
export const iso8601Schema = z.string().datetime({
  message: "Invalid ISO 8601 datetime format (expected: YYYY-MM-DDTHH:mm:ssZ)"
});

export const timezoneSchema = z.string().regex(
  /^[A-Za-z]+\/[A-Za-z_]+$/,
  "Invalid timezone format (expected: Region/City, e.g., America/New_York)"
);

// Pagination validators
export const paginationSchema = {
  perPage: z.number()
    .min(1, "perPage must be at least 1")
    .max(1000, "perPage cannot exceed 1000")
    .optional()
    .describe("Number of entries per page (max 1000)"),
  startingAfter: z.string().optional().describe("Pagination starting after ID"),
  endingBefore: z.string().optional().describe("Pagination ending before ID"),
};

// Array size validators
export const serialsArraySchema = z.array(z.string())
  .max(100, "Cannot process more than 100 serials at once")
  .describe("Array of device serials (max 100)");

export const networkIdsArraySchema = z.array(z.string())
  .max(100, "Cannot process more than 100 networks at once")
  .describe("Array of network IDs (max 100)");

export const macAddressArraySchema = z.array(macAddressSchema)
  .max(100, "Cannot process more than 100 MAC addresses at once")
  .describe("Array of MAC addresses (max 100)");

// String length validators
export const nameSchema = z.string()
  .min(1, "Name cannot be empty")
  .max(255, "Name cannot exceed 255 characters");

export const notesSchema = z.string()
  .max(1000, "Notes cannot exceed 1000 characters");

export const descriptionSchema = z.string()
  .max(500, "Description cannot exceed 500 characters");

// Numeric range validators
export const timeoutSchema = z.number()
  .min(0, "Timeout cannot be negative")
  .max(3600, "Timeout cannot exceed 3600 seconds (1 hour)");

export const thresholdSchema = z.number()
  .min(0, "Threshold cannot be negative")
  .max(10000, "Threshold cannot exceed 10000");

export const portSchema = z.number()
  .min(1, "Port must be between 1 and 65535")
  .max(65535, "Port must be between 1 and 65535");

// Meraki-specific validators
export const merakiSerialSchema = z.string().regex(
  /^Q[0-9A-Z]{3}-[0-9A-Z]{4}-[0-9A-Z]{4}$/,
  "Invalid Meraki serial format (expected: QXXX-XXXX-XXXX)"
);

export const vlanIdSchema = z.number()
  .min(1, "VLAN ID must be between 1 and 4094")
  .max(4094, "VLAN ID must be between 1 and 4094");

// Time range validators
export const timespanSchema = z.coerce.number()
  .min(60, "Timespan must be at least 60 seconds")
  .max(2678400, "Timespan cannot exceed 31 days (2678400 seconds)")
  .describe("Timespan in seconds (min 1 minute, max 31 days)");

export const trafficTimespanSchema = z.coerce.number()
  .min(7200, "Traffic analysis requires at least 2 hours (7200 seconds)")
  .max(2592000, "Traffic analysis cannot exceed 30 days (2592000 seconds)")
  .default(86400)
  .describe("Timespan in seconds (min 2 hours, max 30 days, default 24 hours)");

// Composite validators for common parameter groups
export const timeRangeParams = {
  t0: iso8601Schema.optional().describe("The beginning of the timespan in ISO 8601 format"),
  t1: iso8601Schema.optional().describe("The end of the timespan in ISO 8601 format"),
  timespan: timespanSchema.optional().describe("The timespan in seconds"),
};

export const deviceFilterParams = {
  mac: macAddressSchema.optional().describe("Filter by MAC address"),
  serial: merakiSerialSchema.optional().describe("Filter by device serial"),
  name: z.string().optional().describe("Filter by device name"),
  model: z.string().optional().describe("Filter by device model"),
};

// Helper function to create array validators with size limits
export function createArraySchema<T extends z.ZodTypeAny>(
  itemSchema: T,
  maxItems: number = 100,
  description?: string
) {
  return z.array(itemSchema)
    .max(maxItems, `Array cannot contain more than ${maxItems} items`)
    .optional()
    .describe(description || `Array of items (max ${maxItems})`);
}