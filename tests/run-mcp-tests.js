#!/usr/bin/env node

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Configuration
const SERVER_PATH = join(__dirname, '..', 'build', 'index.js');

// Test tracking
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  details: []
};

// Console colors
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

// All read-only tools to test
const READ_ONLY_TOOLS = [
  // Organization tools
  { name: 'organization_list', params: {} },
  { name: 'organization_get', params: { organizationId: null } }, // Will be filled
  { name: 'organization_networks_list', params: { organizationId: null } },
  { name: 'organization_devices_list', params: { organizationId: null, perPage: 5 } },
  { name: 'organization_devices_statuses', params: { organizationId: null, perPage: 5 } },
  { name: 'organization_devices_availabilities', params: { organizationId: null, perPage: 5 } },
  { name: 'organization_licenses_list', params: { organizationId: null } },
  { name: 'organization_licenses_overview', params: { organizationId: null } },
  { name: 'organization_admins_list', params: { organizationId: null } },
  { name: 'organization_inventory_devices', params: { organizationId: null, perPage: 5 } },
  { name: 'organization_uplinks_statuses', params: { organizationId: null, perPage: 5 } },
  
  // Network tools
  { name: 'network_get', params: { networkId: null } }, // Will be filled
  { name: 'network_clients_list', params: { networkId: null, timespan: 7200, perPage: 5 } },
  { name: 'network_devices_list', params: { networkId: null } },
  { name: 'network_traffic_get', params: { networkId: null, timespan: 7200 } },
  { name: 'network_events_list', params: { networkId: null, productType: 'appliance', perPage: 5 } },
  { name: 'network_firmware_upgrades_get', params: { networkId: null } },
  { name: 'network_settings_get', params: { networkId: null } },
  { name: 'network_alerts_settings_get', params: { networkId: null } }
];

async function runTests() {
  console.log(`${colors.yellow}🚀 Starting Meraki MCP Read-Only Tools Test Suite${colors.reset}\n`);
  
  // Start the MCP server
  console.log('Starting MCP server...');
  const serverProcess = spawn('node', [SERVER_PATH], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env }
  });

  // Create transport and client
  const transport = new StdioClientTransport({
    command: 'node',
    args: [SERVER_PATH],
    env: process.env
  });

  const client = new Client({
    name: 'meraki-test-client',
    version: '1.0.0'
  }, {
    capabilities: {}
  });

  try {
    // Connect to server
    await client.connect(transport);
    console.log('Connected to MCP server ✓\n');

    // First, get organization and network IDs
    console.log('Fetching test data...');
    let orgId = null;
    let networkId = null;

    // Get organization ID
    try {
      const orgResult = await client.callTool('organization_list', {});
      const orgs = JSON.parse(orgResult.content[0].text);
      if (orgs.length > 0) {
        orgId = orgs[0].id;
        console.log(`Using Organization: ${orgs[0].name} (${orgId})`);
      }
    } catch (error) {
      console.error('Failed to get organizations:', error.message);
      return;
    }

    // Get network ID
    if (orgId) {
      try {
        const netResult = await client.callTool('organization_networks_list', { 
          organizationId: orgId 
        });
        const networks = JSON.parse(netResult.content[0].text);
        if (networks.length > 0) {
          networkId = networks[0].id;
          console.log(`Using Network: ${networks[0].name} (${networkId})`);
        }
      } catch (error) {
        console.error('Failed to get networks:', error.message);
      }
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // Update tool parameters with actual IDs
    const tools = READ_ONLY_TOOLS.map(tool => {
      const params = { ...tool.params };
      if ('organizationId' in params) params.organizationId = orgId;
      if ('networkId' in params) params.networkId = networkId;
      return { ...tool, params };
    });

    // Run tests in batches to avoid rate limiting
    const batchSize = 3;
    const delay = 1200; // 1.2 seconds between batches

    for (let i = 0; i < tools.length; i += batchSize) {
      const batch = tools.slice(i, i + batchSize);
      
      // Run batch in parallel
      await Promise.all(
        batch.map(async (tool) => {
          const start = Date.now();
          results.total++;
          
          try {
            console.log(`${colors.blue}Testing ${tool.name}...${colors.reset}`);
            
            // Skip if required params are missing
            if ((tool.params.organizationId === null && 'organizationId' in tool.params) ||
                (tool.params.networkId === null && 'networkId' in tool.params)) {
              console.log(`${colors.yellow}⚠ SKIPPED (missing required ID)${colors.reset}`);
              results.details.push({
                tool: tool.name,
                status: 'skipped',
                reason: 'Missing required ID'
              });
              return;
            }

            const result = await client.callTool(tool.name, tool.params);
            const duration = Date.now() - start;
            
            // Parse and validate result
            const data = JSON.parse(result.content[0].text);
            const dataInfo = Array.isArray(data) 
              ? `${data.length} items` 
              : 'object received';
            
            console.log(`${colors.green}✓ PASSED${colors.reset} (${duration}ms) - ${dataInfo}`);
            results.passed++;
            results.details.push({
              tool: tool.name,
              status: 'passed',
              duration,
              dataInfo
            });
            
          } catch (error) {
            const duration = Date.now() - start;
            console.log(`${colors.red}✗ FAILED${colors.reset} (${duration}ms) - ${error.message}`);
            results.failed++;
            results.details.push({
              tool: tool.name,
              status: 'failed',
              duration,
              error: error.message
            });
          }
        })
      );

      // Delay between batches
      if (i + batchSize < tools.length) {
        console.log(`\n${colors.yellow}Rate limit delay...${colors.reset}\n`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // Print summary
    console.log('\n' + '='.repeat(60) + '\n');
    console.log(`${colors.yellow}📊 TEST SUMMARY${colors.reset}\n`);
    console.log(`Total Tests: ${results.total}`);
    console.log(`${colors.green}Passed: ${results.passed}${colors.reset}`);
    console.log(`${colors.red}Failed: ${results.failed}${colors.reset}`);
    console.log(`Skipped: ${results.total - results.passed - results.failed}`);

    // Show failed tests
    if (results.failed > 0) {
      console.log(`\n${colors.red}Failed Tests:${colors.reset}`);
      results.details
        .filter(d => d.status === 'failed')
        .forEach(d => console.log(`  - ${d.tool}: ${d.error}`));
    }

    // Save results
    const fs = await import('fs/promises');
    const reportPath = join(__dirname, 'test-results.json');
    await fs.writeFile(reportPath, JSON.stringify(results, null, 2));
    console.log(`\n📄 Detailed results saved to: ${reportPath}`);

  } catch (error) {
    console.error(`${colors.red}Test suite error: ${error.message}${colors.reset}`);
  } finally {
    // Cleanup
    await client.close();
    serverProcess.kill();
    process.exit(results.failed > 0 ? 1 : 0);
  }
}

// Run the test suite
runTests().catch(console.error);