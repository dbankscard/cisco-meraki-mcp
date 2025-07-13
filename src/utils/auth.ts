import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";

// Environment variable name for Meraki API key
const MERAKI_API_KEY_ENV = "MERAKI_API_KEY";

// Base URL for Meraki API (default for most regions)
const DEFAULT_BASE_URL = "https://api.meraki.com/api/v1";

export interface AuthConfig {
  apiKey: string;
  baseUrl: string;
}

/**
 * Validates and returns the Meraki API key from environment variables
 */
export function validateApiKey(): string {
  const apiKey = process.env[MERAKI_API_KEY_ENV];
  
  if (!apiKey) {
    throw new McpError(
      ErrorCode.InvalidRequest,
      `Missing required environment variable: ${MERAKI_API_KEY_ENV}. ` +
      `Please set your Meraki Dashboard API key in the environment.`
    );
  }
  
  // Basic validation of API key format
  if (!apiKey.match(/^[a-fA-F0-9]{40}$/)) {
    throw new McpError(
      ErrorCode.InvalidRequest,
      `Invalid Meraki API key format. API keys should be 40 hexadecimal characters.`
    );
  }
  
  return apiKey;
}

/**
 * Gets the base URL for API requests
 * Can be overridden with MERAKI_API_BASE_URL environment variable
 */
export function getBaseUrl(): string {
  return process.env.MERAKI_API_BASE_URL || DEFAULT_BASE_URL;
}

/**
 * Gets the complete authentication configuration
 */
export function getAuthConfig(): AuthConfig {
  return {
    apiKey: validateApiKey(),
    baseUrl: getBaseUrl(),
  };
}

/**
 * Creates authorization headers for Meraki API requests
 * Updated to use Bearer authentication as per API v1 specification
 */
export function getAuthHeaders(apiKey?: string): Record<string, string> {
  const key = apiKey || validateApiKey();
  
  return {
    "Authorization": `Bearer ${key}`,  // Updated to Bearer format
    "Content-Type": "application/json",
    "Accept": "application/json",
    "User-Agent": "cisco-meraki-mcp/0.1.0",
  };
}

/**
 * Creates legacy authorization headers for backward compatibility
 * Only use this if Bearer authentication fails
 */
export function getLegacyAuthHeaders(apiKey?: string): Record<string, string> {
  const key = apiKey || validateApiKey();
  
  return {
    "X-Cisco-Meraki-API-Key": key,
    "Content-Type": "application/json",
    "Accept": "application/json",
    "User-Agent": "cisco-meraki-mcp/0.1.0",
  };
}