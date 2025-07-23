import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { ZodSchema } from "zod";
import { getHttpClient, MerakiHttpClient } from "./http-client.js";
import { handleError, validateRequired } from "./error-handler.js";
import { MerakiApiResponse } from "../types/common.js";
import { settingsManager } from "./settings.js";
import { createSummaryResponse } from "./response-optimizer.js";

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "COMPOSITE";

export interface ToolConfig<TParams = any, TResponse = any> {
  name: string;
  description: string;
  method: HttpMethod;
  endpoint?: string | ((params: TParams) => string);
  inputSchema: ZodSchema<TParams>;
  requiredParams?: Array<keyof TParams>;
  transformParams?: (params: TParams) => any;
  transformResponse?: (response: any) => TResponse;
  customExecutor?: (params: TParams, apiClient: MerakiHttpClient) => Promise<TResponse>;
}

/**
 * Base class for all Meraki API tools
 */
export abstract class BaseTool<TParams = any, TResponse = any> {
  protected config: ToolConfig<TParams, TResponse>;
  protected httpClient: MerakiHttpClient;
  
  constructor(config: ToolConfig<TParams, TResponse>) {
    this.config = config;
    this.httpClient = getHttpClient();
  }
  
  /**
   * Get the tool definition for MCP
   */
  getToolDefinition(): Tool {
    const requiresApproval = !settingsManager.shouldAutoApprove(this.config.name);
    
    return {
      name: this.config.name,
      description: this.config.description,
      inputSchema: {
        type: "object",
        properties: this.getInputSchemaProperties(),
        required: this.config.requiredParams as string[] || [],
      },
      // Add approval requirement based on settings
      ...(requiresApproval && { requiresApproval: true }),
    };
  }
  
  /**
   * Execute the tool with given parameters
   */
  async execute(params: TParams): Promise<TResponse> {
    try {
      // Apply default parameters from settings
      const defaultParams = settingsManager.getDefaultParams(this.config.name);
      const paramsWithDefaults = { ...defaultParams, ...params };
      
      // Apply type coercion BEFORE validation
      const coercedParams = this.coerceParameterTypes(paramsWithDefaults);
      
      // Apply transformParams BEFORE validation if present
      const transformedParams = this.config.transformParams
        ? this.config.transformParams(coercedParams)
        : coercedParams;
      
      // Validate parameters
      const validatedParams = await this.validateParams(transformedParams);
      
      // Handle custom executor for composite operations
      if (this.config.method === "COMPOSITE" && this.config.customExecutor) {
        let result = await this.config.customExecutor(validatedParams, this.httpClient);
        
        // Apply response optimization for large datasets
        result = this.applyResponseOptimization(result);
        
        return result as TResponse;
      }
      
      // Build endpoint URL for standard HTTP methods
      const endpoint = typeof this.config.endpoint === "function"
        ? this.config.endpoint(validatedParams)
        : this.config.endpoint;
      
      if (!endpoint) {
        throw new Error(`Endpoint is required for method: ${this.config.method}`);
      }
      
      // Parameters are already transformed, so use them directly
      const requestParams = validatedParams;
      
      // Separate path params from query/body params
      const { pathParams, otherParams } = this.separateParams(endpoint, requestParams);
      
      // Replace path parameters in endpoint
      const finalEndpoint = this.replacePathParams(endpoint, pathParams);
      
      // Execute the request
      let response: MerakiApiResponse<any>;
      
      switch (this.config.method) {
        case "GET":
          response = await this.httpClient.get(finalEndpoint, otherParams);
          break;
        case "POST":
          response = await this.httpClient.post(finalEndpoint, otherParams);
          break;
        case "PUT":
          response = await this.httpClient.put(finalEndpoint, otherParams);
          break;
        case "DELETE":
          response = await this.httpClient.delete(finalEndpoint, otherParams);
          break;
        default:
          throw new Error(`Unsupported HTTP method: ${this.config.method}`);
      }
      
      // Transform response if needed
      let result = this.config.transformResponse
        ? this.config.transformResponse(response.data)
        : response.data;
      
      // Apply response optimization for large datasets
      result = this.applyResponseOptimization(result);
      
      return result as TResponse;
      
    } catch (error) {
      handleError(error);
    }
  }
  
  /**
   * Validate input parameters
   */
  protected async validateParams(params: TParams): Promise<TParams> {
    // Parameters should already be coerced and transformed by execute()
    // Validate with Zod schema
    const result = await this.config.inputSchema.safeParseAsync(params);
    
    if (!result.success) {
      const firstError = result.error.errors[0];
      if (firstError) {
        throw new Error(`Validation error: ${firstError.path.join(".")}: ${firstError.message}`);
      } else {
        throw new Error(`Validation error: Invalid input`);
      }
    }
    
    // Additional required field validation
    if (this.config.requiredParams) {
      validateRequired(result.data as Record<string, any>, this.config.requiredParams as string[]);
    }
    
    return result.data;
  }
  
  /**
   * Apply response optimization to prevent token limit issues
   */
  protected applyResponseOptimization(response: any): any {
    const settings = settingsManager.getSettings();
    const limits = settings.responseLimits || {
      maxArrayLength: 50,
      maxResponseSize: 30000,
      summarizeArrays: true
    };
    
    // Check response size
    const responseStr = JSON.stringify(response);
    const responseSize = responseStr.length;
    
    // For list operations, apply smart defaults
    if (this.config.name.includes('_list') && Array.isArray(response)) {
      // Apply automatic pagination limit
      if (response.length > limits.maxArrayLength) {
        console.error(`[${this.config.name}] Response contains ${response.length} items, limiting to ${limits.maxArrayLength}`);
        return {
          data: response.slice(0, limits.maxArrayLength),
          meta: {
            total: response.length,
            returned: limits.maxArrayLength,
            truncated: true,
            hint: `Use perPage parameter to control response size. Max recommended: ${limits.maxArrayLength}`
          }
        };
      }
    }
    
    // For very large responses, create a summary
    if (responseSize > limits.maxResponseSize && limits.summarizeArrays) {
      console.error(`[${this.config.name}] Large response detected (${responseSize} bytes), creating summary`);
      
      // Use tool-specific summary fields
      const summaryFields = this.getSummaryFields();
      return createSummaryResponse(response, summaryFields);
    }
    
    return response;
  }
  
  /**
   * Get fields to include in summary based on tool type
   */
  protected getSummaryFields(): string[] {
    const toolName = this.config.name;
    
    if (toolName.includes('clients')) {
      return ['description', 'mac', 'ip', 'vlan', 'status'];
    } else if (toolName.includes('devices')) {
      return ['name', 'model', 'serial', 'status', 'productType'];
    } else if (toolName.includes('events')) {
      return ['type', 'category', 'occurredAt', 'description'];
    } else if (toolName.includes('networks')) {
      return ['name', 'id', 'productTypes', 'timeZone'];
    } else if (toolName.includes('licenses')) {
      return ['licenseType', 'state', 'expirationDate'];
    }
    
    // Default fields for unknown types
    return ['name', 'id', 'type', 'status'];
  }
  
  /**
   * Get input schema properties for tool definition
   */
  protected getInputSchemaProperties(): Record<string, any> {
    // Convert Zod schema to JSON Schema format
    // This is a simplified conversion - you might want to use a library for complex schemas
    const zodShape = (this.config.inputSchema as any)._def?.shape?.() || {};
    const properties: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(zodShape)) {
      properties[key] = this.zodToJsonSchema(value as any);
    }
    
    return properties;
  }
  
  /**
   * Coerce parameter types to match expected types
   */
  protected coerceParameterTypes(params: any): any {
    const result = { ...params };
    
    // Get the schema shape to understand expected types
    const schemaShape = (this.config.inputSchema as any)._def?.shape?.() || {};
    
    for (const [key, value] of Object.entries(result)) {
      if (value === null || value === undefined) continue;
      
      const fieldSchema = schemaShape[key];
      if (!fieldSchema) continue;
      
      let typeName = fieldSchema._def?.typeName;
      let innerSchema = fieldSchema;
      
      // Handle optional types by getting the inner type
      if (typeName === "ZodOptional" && fieldSchema._def?.innerType) {
        innerSchema = fieldSchema._def.innerType;
        typeName = innerSchema._def?.typeName;
      }
      
      // Handle default types by getting the inner type
      if (typeName === "ZodDefault" && fieldSchema._def?.innerType) {
        innerSchema = fieldSchema._def.innerType;
        typeName = innerSchema._def?.typeName;
      }
      
      // Note: For z.coerce.number() schemas, Zod handles the coercion internally
      // We only need to handle manual coercion for non-coerce schemas
      // Since we've updated validators to use z.coerce.number(), manual coercion
      // is less critical, but we'll keep it for backward compatibility
      
      // Convert string to number if schema expects number (and isn't already coercing)
      if (typeName === "ZodNumber" && typeof value === "string" && !innerSchema._def?.coerce) {
        const num = Number(value);
        if (!isNaN(num)) {
          result[key] = num;
        }
      }
      // Convert string "true"/"false" to boolean if schema expects boolean
      else if (typeName === "ZodBoolean" && typeof value === "string") {
        if (value === "true") result[key] = true;
        else if (value === "false") result[key] = false;
      }
      // Handle arrays that might come as comma-separated strings
      else if (typeName === "ZodArray" && typeof value === "string") {
        result[key] = value.split(",").map(v => v.trim()).filter(v => v);
      }
    }
    
    return result;
  }
  
  /**
   * Convert Zod schema to JSON Schema (simplified)
   */
  protected zodToJsonSchema(zodSchema: any): any {
    const def = zodSchema._def;
    
    if (def.typeName === "ZodString") {
      return { type: "string", description: def.description };
    } else if (def.typeName === "ZodNumber") {
      return { type: "number", description: def.description };
    } else if (def.typeName === "ZodBoolean") {
      return { type: "boolean", description: def.description };
    } else if (def.typeName === "ZodArray") {
      return {
        type: "array",
        items: this.zodToJsonSchema(def.type),
        description: def.description,
      };
    } else if (def.typeName === "ZodObject") {
      const properties: Record<string, any> = {};
      const shape = zodSchema._def.shape();
      
      for (const [key, value] of Object.entries(shape)) {
        properties[key] = this.zodToJsonSchema(value);
      }
      
      return {
        type: "object",
        properties,
        description: def.description,
      };
    } else if (def.typeName === "ZodEnum") {
      return {
        type: "string",
        enum: def.values,
        description: def.description,
      };
    } else if (def.typeName === "ZodOptional") {
      return this.zodToJsonSchema(def.innerType);
    }
    
    // Default fallback
    return { type: "string", description: def?.description };
  }
  
  /**
   * Separate path parameters from other parameters
   */
  protected separateParams(
    endpoint: string,
    params: any
  ): { pathParams: Record<string, string>; otherParams: any } {
    const pathParams: Record<string, string> = {};
    const otherParams = { ...params };
    
    // Find all path parameters in the endpoint (e.g., {organizationId})
    const pathParamMatches = endpoint.match(/\{([^}]+)\}/g) || [];
    
    for (const match of pathParamMatches) {
      const paramName = match.slice(1, -1); // Remove { and }
      if (paramName in params) {
        pathParams[paramName] = String(params[paramName]);
        delete otherParams[paramName];
      }
    }
    
    return { pathParams, otherParams };
  }
  
  /**
   * Replace path parameters in endpoint URL
   */
  protected replacePathParams(
    endpoint: string,
    pathParams: Record<string, string>
  ): string {
    let result = endpoint;
    
    for (const [key, value] of Object.entries(pathParams)) {
      result = result.replace(`{${key}}`, encodeURIComponent(value));
    }
    
    return result;
  }
}

/**
 * Factory function to create a tool from configuration
 */
export function createTool<TParams = any, TResponse = any>(
  config: ToolConfig<TParams, TResponse>
): BaseTool<TParams, TResponse> {
  return new (class extends BaseTool<TParams, TResponse> {
    constructor() {
      super(config);
    }
  })();
}

/**
 * Register multiple tools at once
 */
export function registerTools(
  tools: Map<string, Tool>,
  toolConfigs: ToolConfig[]
): void {
  for (const config of toolConfigs) {
    const tool = createTool(config);
    tools.set(config.name, tool.getToolDefinition());
  }
}