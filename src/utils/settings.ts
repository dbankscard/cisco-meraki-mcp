import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export interface AutoApproveSettings {
  enabled: boolean;
  tools: {
    all?: boolean;
    patterns?: string[];
    specific?: string[];
    exclude?: string[];
  };
  readOnlyByDefault?: boolean;
}

export interface ResponseLimits {
  maxArrayLength: number;
  maxResponseSize: number;
  summarizeArrays: boolean;
  truncateLongStrings?: boolean;
  maxStringLength?: number;
}

export interface MerakiMCPSettings {
  autoApprove?: AutoApproveSettings;
  rateLimit?: {
    requestsPerSecond?: number;
    burstSize?: number;
  };
  logging?: {
    level?: "debug" | "info" | "warn" | "error";
    logApiCalls?: boolean;
  };
  responseLimits?: ResponseLimits;
  defaultParams?: {
    [toolPattern: string]: {
      [param: string]: any;
    };
  };
}

const DEFAULT_SETTINGS: MerakiMCPSettings = {
  autoApprove: {
    enabled: false,
    tools: {
      all: false,
      patterns: [],
      specific: [],
      exclude: []
    },
    readOnlyByDefault: true
  },
  rateLimit: {
    requestsPerSecond: 5,
    burstSize: 10
  },
  logging: {
    level: "info",
    logApiCalls: true
  },
  responseLimits: {
    maxArrayLength: 50,
    maxResponseSize: 30000,
    summarizeArrays: true,
    truncateLongStrings: true,
    maxStringLength: 1000
  },
  defaultParams: {
    "*_list": {
      "perPage": 25
    },
    "network_clients_list": {
      "perPage": 20,
      "timespan": 3600
    },
    "network_events_list": {
      "perPage": 20
    },
    "organization_devices_list": {
      "perPage": 50
    }
  }
};

class SettingsManager {
  private settings: MerakiMCPSettings;
  private settingsPath: string;

  constructor() {
    this.settingsPath = this.findSettingsFile();
    this.settings = this.loadSettings();
  }

  /**
   * Find settings file in order of precedence
   */
  private findSettingsFile(): string {
    const possiblePaths = [
      process.env.MERAKI_MCP_SETTINGS_PATH,
      join(process.cwd(), "meraki-mcp-settings.json"),
      join(process.cwd(), ".meraki-mcp-settings.json"),
      join(__dirname, "../../meraki-mcp-settings.json"),
    ].filter(Boolean) as string[];

    for (const path of possiblePaths) {
      if (existsSync(path)) {
        console.error(`[Settings] Loading settings from: ${path}`);
        return path;
      }
    }

    console.error("[Settings] No settings file found, using defaults");
    return "";
  }

  /**
   * Load settings from file or use defaults
   */
  private loadSettings(): MerakiMCPSettings {
    if (!this.settingsPath || !existsSync(this.settingsPath)) {
      return { ...DEFAULT_SETTINGS };
    }

    try {
      const fileContent = readFileSync(this.settingsPath, "utf-8");
      const userSettings = JSON.parse(fileContent) as MerakiMCPSettings;
      
      // Deep merge with defaults
      return this.deepMerge(DEFAULT_SETTINGS, userSettings);
    } catch (error) {
      console.error(`[Settings] Error loading settings file: ${error}`);
      return { ...DEFAULT_SETTINGS };
    }
  }

  /**
   * Deep merge two objects
   */
  private deepMerge(target: any, source: any): any {
    const output = { ...target };
    
    if (isObject(target) && isObject(source)) {
      Object.keys(source).forEach(key => {
        if (isObject(source[key])) {
          if (!(key in target)) {
            Object.assign(output, { [key]: source[key] });
          } else {
            output[key] = this.deepMerge(target[key], source[key]);
          }
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }
    
    return output;
  }

  /**
   * Check if a tool should be auto-approved
   */
  public shouldAutoApprove(toolName: string): boolean {
    if (!this.settings.autoApprove?.enabled) {
      return false;
    }

    const { tools } = this.settings.autoApprove;

    // Check if explicitly excluded
    if (tools.exclude?.includes(toolName)) {
      if (this.settings.logging?.level === "debug") {
        console.error(`[Auto-Approve] Tool '${toolName}' is explicitly excluded`);
      }
      return false;
    }

    // Check if all tools are approved
    if (tools.all) {
      console.error(`[Auto-Approve] Tool '${toolName}' auto-approved (all tools enabled)`);
      return true;
    }

    // Check specific tools
    if (tools.specific?.includes(toolName)) {
      console.error(`[Auto-Approve] Tool '${toolName}' auto-approved (specific match)`);
      return true;
    }

    // Check patterns
    if (tools.patterns) {
      for (const pattern of tools.patterns) {
        if (this.matchesPattern(toolName, pattern)) {
          console.error(`[Auto-Approve] Tool '${toolName}' auto-approved (pattern match: ${pattern})`);
          return true;
        }
      }
    }

    // Check read-only by default
    if (this.settings.autoApprove.readOnlyByDefault && this.isReadOnlyTool(toolName)) {
      console.error(`[Auto-Approve] Tool '${toolName}' auto-approved (read-only by default)`);
      return true;
    }

    if (this.settings.logging?.level === "debug") {
      console.error(`[Auto-Approve] Tool '${toolName}' requires manual approval`);
    }
    return false;
  }

  /**
   * Check if tool name matches a pattern
   */
  private matchesPattern(toolName: string, pattern: string): boolean {
    // Convert glob-like pattern to regex
    const regexPattern = pattern
      .replace(/\*/g, ".*")
      .replace(/\?/g, ".")
      .replace(/\[/g, "\\[")
      .replace(/\]/g, "\\]");
    
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(toolName);
  }

  /**
   * Determine if a tool is read-only based on naming convention
   */
  private isReadOnlyTool(toolName: string): boolean {
    const readOnlyPrefixes = ["get", "list", "show", "view", "read", "fetch"];
    const readOnlySuffixes = ["_get", "_list", "_show", "_view", "_read", "_fetch", "_status", "_statuses"];
    
    const lowerToolName = toolName.toLowerCase();
    
    // Check prefixes
    for (const prefix of readOnlyPrefixes) {
      if (lowerToolName.startsWith(prefix)) {
        return true;
      }
    }
    
    // Check suffixes
    for (const suffix of readOnlySuffixes) {
      if (lowerToolName.endsWith(suffix)) {
        return true;
      }
    }
    
    // Check specific patterns
    if (lowerToolName.includes("_get_") || 
        lowerToolName.includes("_list_") ||
        lowerToolName.includes("_statuses") ||
        lowerToolName.includes("_overview")) {
      return true;
    }
    
    return false;
  }

  /**
   * Get current settings
   */
  public getSettings(): MerakiMCPSettings {
    return { ...this.settings };
  }

  /**
   * Get rate limit settings
   */
  public getRateLimit(): { requestsPerSecond: number; burstSize: number } {
    return {
      requestsPerSecond: this.settings.rateLimit?.requestsPerSecond ?? 5,
      burstSize: this.settings.rateLimit?.burstSize ?? 10
    };
  }

  /**
   * Get logging settings
   */
  public getLogging(): { level: string; logApiCalls: boolean } {
    return {
      level: this.settings.logging?.level ?? "info",
      logApiCalls: this.settings.logging?.logApiCalls ?? true
    };
  }

  /**
   * Get response limits
   */
  public getResponseLimits(): ResponseLimits {
    return {
      ...DEFAULT_SETTINGS.responseLimits!,
      ...this.settings.responseLimits
    };
  }

  /**
   * Get default parameters for a tool
   */
  public getDefaultParams(toolName: string): Record<string, any> {
    const defaults: Record<string, any> = {};
    
    if (!this.settings.defaultParams) {
      return defaults;
    }
    
    // Apply pattern-based defaults
    for (const [pattern, params] of Object.entries(this.settings.defaultParams)) {
      if (this.matchesPattern(toolName, pattern)) {
        Object.assign(defaults, params);
      }
    }
    
    // Apply tool-specific defaults (higher priority)
    if (this.settings.defaultParams[toolName]) {
      Object.assign(defaults, this.settings.defaultParams[toolName]);
    }
    
    return defaults;
  }
}

// Helper function to check if value is an object
function isObject(item: any): item is Record<string, any> {
  return item && typeof item === "object" && !Array.isArray(item);
}

// Export singleton instance
export const settingsManager = new SettingsManager();