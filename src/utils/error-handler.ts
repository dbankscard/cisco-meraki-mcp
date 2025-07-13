import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";

/**
 * Custom error class for Meraki API errors
 */
export class MerakiAPIError extends Error {
  public statusCode: number;
  public details: any;
  
  constructor(message: string, statusCode: number, details?: any) {
    super(message);
    this.name = "MerakiAPIError";
    this.statusCode = statusCode;
    this.details = details;
    
    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MerakiAPIError);
    }
  }
  
  /**
   * Convert to MCP error
   */
  toMcpError(): McpError {
    let errorCode = ErrorCode.InternalError;
    
    // Map status codes to MCP error codes
    switch (this.statusCode) {
      case 400:
        errorCode = ErrorCode.InvalidParams;
        break;
      case 401:
      case 403:
        errorCode = ErrorCode.InvalidRequest;
        break;
      case 404:
        errorCode = ErrorCode.MethodNotFound;
        break;
      case 429:
        errorCode = ErrorCode.InternalError; // Rate limit
        break;
      case 500:
      case 502:
      case 503:
        errorCode = ErrorCode.InternalError;
        break;
    }
    
    return new McpError(errorCode, this.message, {
      statusCode: this.statusCode,
      details: this.details,
    });
  }
}

/**
 * Validation error for invalid parameters
 */
export class ValidationError extends Error {
  public field: string;
  public value: any;
  
  constructor(field: string, message: string, value?: any) {
    super(`Validation error for field '${field}': ${message}`);
    this.name = "ValidationError";
    this.field = field;
    this.value = value;
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ValidationError);
    }
  }
  
  /**
   * Convert to MCP error
   */
  toMcpError(): McpError {
    return new McpError(ErrorCode.InvalidParams, this.message, {
      field: this.field,
      value: this.value,
    });
  }
}

/**
 * Handle errors and convert them to appropriate MCP errors
 */
export function handleError(error: unknown): never {
  if (error instanceof McpError) {
    throw error;
  }
  
  if (error instanceof MerakiAPIError) {
    throw error.toMcpError();
  }
  
  if (error instanceof ValidationError) {
    throw error.toMcpError();
  }
  
  if (error instanceof Error) {
    throw new McpError(
      ErrorCode.InternalError,
      error.message,
      { originalError: error.name }
    );
  }
  
  throw new McpError(
    ErrorCode.InternalError,
    "An unknown error occurred",
    { error: String(error) }
  );
}

/**
 * Validate required parameters
 */
export function validateRequired<T extends Record<string, any>>(
  params: T,
  required: Array<keyof T>
): void {
  for (const field of required) {
    if (params[field] === undefined || params[field] === null) {
      throw new ValidationError(
        String(field),
        "This field is required",
        undefined
      );
    }
  }
}

/**
 * Validate parameter is in allowed values
 */
export function validateEnum<T>(
  field: string,
  value: T,
  allowed: readonly T[]
): void {
  if (!allowed.includes(value)) {
    throw new ValidationError(
      field,
      `Value must be one of: ${allowed.join(", ")}`,
      value
    );
  }
}

/**
 * Validate parameter matches pattern
 */
export function validatePattern(
  field: string,
  value: string,
  pattern: RegExp,
  description: string
): void {
  if (!pattern.test(value)) {
    throw new ValidationError(
      field,
      description,
      value
    );
  }
}

/**
 * Validate numeric range
 */
export function validateRange(
  field: string,
  value: number,
  min?: number,
  max?: number
): void {
  if (min !== undefined && value < min) {
    throw new ValidationError(
      field,
      `Value must be at least ${min}`,
      value
    );
  }
  
  if (max !== undefined && value > max) {
    throw new ValidationError(
      field,
      `Value must be at most ${max}`,
      value
    );
  }
}

/**
 * Validate array length
 */
export function validateArrayLength<T>(
  field: string,
  value: T[],
  min?: number,
  max?: number
): void {
  if (min !== undefined && value.length < min) {
    throw new ValidationError(
      field,
      `Array must contain at least ${min} items`,
      value
    );
  }
  
  if (max !== undefined && value.length > max) {
    throw new ValidationError(
      field,
      `Array must contain at most ${max} items`,
      value
    );
  }
}

/**
 * Safely parse JSON with error handling
 */
export function safeJsonParse<T>(json: string, field: string): T {
  try {
    return JSON.parse(json);
  } catch (error) {
    throw new ValidationError(
      field,
      "Invalid JSON format",
      json
    );
  }
}