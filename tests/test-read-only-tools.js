#!/usr/bin/env node

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Test configuration
const MCP_SERVER_PATH = join(__dirname, '..', 'build', 'index.js');
const TEST_TIMEOUT = 30000; // 30 seconds per test

// Color codes for output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

// Read-only tool test cases
const TEST_CASES = {
  organizations: [
    {
      name: 'organization_list',
      description: 'List all organizations',
      params: {},
      validateResponse: (data) => Array.isArray(data) && data.length > 0
    },
    {
      name: 'organization_get',
      description: 'Get organization details',
      params: { organizationId: '${ORG_ID}' },
      validateResponse: (data) => data && data.id && data.name
    },
    {
      name: 'organization_networks_list',
      description: 'List organization networks',
      params: { organizationId: '${ORG_ID}' },
      validateResponse: (data) => Array.isArray(data)
    },
    {
      name: 'organization_devices_list',
      description: 'List organization devices',
      params: { organizationId: '${ORG_ID}', perPage: 10 },
      validateResponse: (data) => Array.isArray(data)
    },
    {
      name: 'organization_devices_statuses',
      description: 'Get device statuses',
      params: { organizationId: '${ORG_ID}', perPage: 10 },
      validateResponse: (data) => Array.isArray(data)
    },
    {
      name: 'organization_devices_availabilities',
      description: 'Get device availabilities',
      params: { organizationId: '${ORG_ID}', perPage: 10 },
      validateResponse: (data) => Array.isArray(data)
    },
    {
      name: 'organization_licenses_list',
      description: 'List organization licenses',
      params: { organizationId: '${ORG_ID}' },
      validateResponse: (data) => Array.isArray(data)
    },
    {
      name: 'organization_licenses_overview',
      description: 'Get licenses overview',
      params: { organizationId: '${ORG_ID}' },
      validateResponse: (data) => data && typeof data === 'object'
    },
    {
      name: 'organization_admins_list',
      description: 'List organization admins',
      params: { organizationId: '${ORG_ID}' },
      validateResponse: (data) => Array.isArray(data)
    },
    {
      name: 'organization_inventory_devices',
      description: 'Get inventory devices',
      params: { organizationId: '${ORG_ID}', perPage: 10 },
      validateResponse: (data) => Array.isArray(data)
    },
    {
      name: 'organization_uplinks_statuses',
      description: 'Get uplink statuses',
      params: { organizationId: '${ORG_ID}', perPage: 10 },
      validateResponse: (data) => Array.isArray(data)
    }
  ],
  networks: [
    {
      name: 'network_get',
      description: 'Get network details',
      params: { networkId: '${NETWORK_ID}' },
      validateResponse: (data) => data && data.id && data.name
    },
    {
      name: 'network_clients_list',
      description: 'List network clients',
      params: { networkId: '${NETWORK_ID}', timespan: 86400, perPage: 10 },
      validateResponse: (data) => Array.isArray(data)
    },
    {
      name: 'network_devices_list',
      description: 'List network devices',
      params: { networkId: '${NETWORK_ID}' },
      validateResponse: (data) => Array.isArray(data)
    },
    {
      name: 'network_traffic_get',
      description: 'Get network traffic',
      params: { networkId: '${NETWORK_ID}', timespan: 86400 },
      validateResponse: (data) => Array.isArray(data)
    },
    {
      name: 'network_events_list',
      description: 'List network events',
      params: { networkId: '${NETWORK_ID}', productType: 'appliance', perPage: 10 },
      validateResponse: (data) => data && typeof data === 'object'
    },
    {
      name: 'network_firmware_upgrades_get',
      description: 'Get firmware upgrades',
      params: { networkId: '${NETWORK_ID}' },
      validateResponse: (data) => data && typeof data === 'object'
    },
    {
      name: 'network_settings_get',
      description: 'Get network settings',
      params: { networkId: '${NETWORK_ID}' },
      validateResponse: (data) => data && typeof data === 'object'
    },
    {
      name: 'network_alerts_settings_get',
      description: 'Get alert settings',
      params: { networkId: '${NETWORK_ID}' },
      validateResponse: (data) => data && typeof data === 'object'
    }
  ]
};

// Test runner class
class MerakiMCPTester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      errors: [],
      details: []
    };
    this.orgId = null;
    this.networkId = null;
  }

  // Execute a single MCP tool
  async executeTool(toolName, params) {
    return new Promise((resolve, reject) => {
      const child = spawn('node', [MCP_SERVER_PATH], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';
      const timeout = setTimeout(() => {
        child.kill();
        reject(new Error('Test timeout'));
      }, TEST_TIMEOUT);

      // Send the tool request
      const request = {
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          name: toolName,
          arguments: params
        },
        id: 1
      };

      child.stdin.write(JSON.stringify(request) + '\n');

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        clearTimeout(timeout);
        try {
          const lines = stdout.split('\n').filter(line => line.trim());
          const response = JSON.parse(lines[lines.length - 1]);
          if (response.error) {
            reject(new Error(response.error.message));
          } else {
            resolve(response.result);
          }
        } catch (e) {
          reject(new Error(`Failed to parse response: ${e.message}`));
        }
      });
    });
  }

  // Replace template variables in parameters
  replaceTemplateVars(params) {
    const str = JSON.stringify(params);
    const replaced = str
      .replace(/\${ORG_ID}/g, this.orgId)
      .replace(/\${NETWORK_ID}/g, this.networkId);
    return JSON.parse(replaced);
  }

  // Run a single test
  async runTest(test, category) {
    const startTime = Date.now();
    const testName = `${category}/${test.name}`;
    
    try {
      console.log(`${colors.blue}Testing ${testName}: ${test.description}${colors.reset}`);
      
      const params = this.replaceTemplateVars(test.params);
      const result = await this.executeTool(test.name, params);
      
      // Parse the response content
      let data;
      try {
        if (result.content && result.content[0] && result.content[0].text) {
          data = JSON.parse(result.content[0].text);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (e) {
        throw new Error(`Failed to parse tool response: ${e.message}`);
      }
      
      // Validate the response
      if (test.validateResponse(data)) {
        const duration = Date.now() - startTime;
        console.log(`${colors.green}✓ PASSED${colors.reset} (${duration}ms)`);
        this.results.passed++;
        this.results.details.push({
          test: testName,
          status: 'passed',
          duration,
          dataReceived: Array.isArray(data) ? data.length : 'object'
        });
      } else {
        throw new Error('Response validation failed');
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      console.log(`${colors.red}✗ FAILED: ${error.message}${colors.reset} (${duration}ms)`);
      this.results.failed++;
      this.results.errors.push({
        test: testName,
        error: error.message,
        duration
      });
    }
  }

  // Run all tests in parallel batches
  async runAllTests() {
    console.log(`${colors.yellow}Starting Meraki MCP Read-Only Tools Test Suite${colors.reset}\n`);
    
    // First, get organization ID
    try {
      console.log('Fetching organization ID...');
      const orgResult = await this.executeTool('organization_list', {});
      const orgs = JSON.parse(orgResult.content[0].text);
      if (orgs.length > 0) {
        this.orgId = orgs[0].id;
        console.log(`Using organization: ${orgs[0].name} (${this.orgId})\n`);
      } else {
        throw new Error('No organizations found');
      }
    } catch (error) {
      console.error(`${colors.red}Failed to get organization ID: ${error.message}${colors.reset}`);
      return;
    }

    // Get a network ID
    try {
      console.log('Fetching network ID...');
      const netResult = await this.executeTool('organization_networks_list', { 
        organizationId: this.orgId 
      });
      const networks = JSON.parse(netResult.content[0].text);
      if (networks.length > 0) {
        this.networkId = networks[0].id;
        console.log(`Using network: ${networks[0].name} (${this.networkId})\n`);
      } else {
        throw new Error('No networks found');
      }
    } catch (error) {
      console.error(`${colors.red}Failed to get network ID: ${error.message}${colors.reset}`);
      return;
    }

    // Run tests by category
    for (const [category, tests] of Object.entries(TEST_CASES)) {
      console.log(`\n${colors.yellow}=== Testing ${category.toUpperCase()} tools ===${colors.reset}\n`);
      
      // Run tests in batches of 3 to avoid rate limiting
      const batchSize = 3;
      for (let i = 0; i < tests.length; i += batchSize) {
        const batch = tests.slice(i, i + batchSize);
        await Promise.all(
          batch.map(test => this.runTest(test, category))
        );
        
        // Add delay between batches to respect rate limits
        if (i + batchSize < tests.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    // Print summary
    this.printSummary();
  }

  // Print test summary
  printSummary() {
    console.log(`\n${colors.yellow}=== TEST SUMMARY ===${colors.reset}\n`);
    console.log(`Total Tests: ${this.results.passed + this.results.failed}`);
    console.log(`${colors.green}Passed: ${this.results.passed}${colors.reset}`);
    console.log(`${colors.red}Failed: ${this.results.failed}${colors.reset}`);
    
    if (this.results.errors.length > 0) {
      console.log(`\n${colors.red}Failed Tests:${colors.reset}`);
      this.results.errors.forEach(error => {
        console.log(`  - ${error.test}: ${error.error}`);
      });
    }

    // Save detailed results
    const reportPath = join(__dirname, 'test-results.json');
    fs.writeFile(reportPath, JSON.stringify(this.results, null, 2))
      .then(() => console.log(`\nDetailed results saved to: ${reportPath}`))
      .catch(err => console.error('Failed to save results:', err));
  }
}

// Main execution
async function main() {
  const tester = new MerakiMCPTester();
  try {
    await tester.runAllTests();
  } catch (error) {
    console.error(`${colors.red}Test suite failed: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Run the tests
main();