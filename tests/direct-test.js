#!/usr/bin/env node

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));

// Test configuration
const results = {
  timestamp: new Date().toISOString(),
  environment: {
    apiKeyPresent: !!process.env.MERAKI_API_KEY,
    serverPath: join(__dirname, '..', 'build', 'index.js')
  },
  tests: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0
  }
};

// Colors for output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

// Test execution
async function executeCommand(command) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [join(__dirname, '..', 'build', 'index.js')], {
      env: process.env,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';
    let responseReceived = false;

    // Timeout
    const timeout = setTimeout(() => {
      if (!responseReceived) {
        child.kill();
        reject(new Error('Command timeout (30s)'));
      }
    }, 30000);

    // Send request
    const request = JSON.stringify({
      jsonrpc: '2.0',
      method: 'tools/call',
      params: command,
      id: 1
    });

    child.stdin.write(request + '\n');
    child.stdin.end();

    child.stdout.on('data', (data) => {
      stdout += data.toString();
      // Check if we have a complete response
      if (stdout.includes('"jsonrpc":"2.0"')) {
        responseReceived = true;
      }
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', () => {
      clearTimeout(timeout);
      
      try {
        // Find JSON response in stdout
        const lines = stdout.split('\n');
        let response = null;
        
        for (const line of lines) {
          if (line.includes('"jsonrpc":"2.0"')) {
            response = JSON.parse(line);
            break;
          }
        }
        
        if (!response) {
          // Log stderr for debugging
          if (stderr) {
            console.error(`${colors.yellow}Server logs:${colors.reset}`);
            console.error(stderr);
          }
          reject(new Error('No valid JSON-RPC response found'));
          return;
        }

        if (response.error) {
          reject(new Error(response.error.message || 'Unknown error'));
        } else {
          resolve(response.result);
        }
      } catch (e) {
        reject(new Error(`Parse error: ${e.message}`));
      }
    });

    child.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}

// Test a single tool
async function testTool(name, params, description) {
  const startTime = Date.now();
  console.log(`\n${colors.blue}Testing: ${name}${colors.reset}`);
  console.log(`${colors.cyan}${description}${colors.reset}`);
  
  results.summary.total++;
  
  try {
    const result = await executeCommand({ name, arguments: params });
    const duration = Date.now() - startTime;
    
    // Parse result
    let data = null;
    if (result.content && result.content[0] && result.content[0].text) {
      data = JSON.parse(result.content[0].text);
    }
    
    const dataInfo = Array.isArray(data) 
      ? `${data.length} items returned`
      : data ? 'Data object returned' : 'Empty response';
    
    console.log(`${colors.green}✓ PASSED${colors.reset} (${duration}ms) - ${dataInfo}`);
    
    results.tests.push({
      name,
      status: 'passed',
      duration,
      dataInfo,
      params
    });
    results.summary.passed++;
    
    return data;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`${colors.red}✗ FAILED${colors.reset} (${duration}ms) - ${error.message}`);
    
    results.tests.push({
      name,
      status: 'failed',
      duration,
      error: error.message,
      params
    });
    results.summary.failed++;
    
    return null;
  }
}

// Main test runner
async function runTests() {
  console.log(`${colors.yellow}🧪 Meraki MCP Read-Only Tools Test Suite${colors.reset}`);
  console.log(`${colors.yellow}${'='.repeat(50)}${colors.reset}\n`);
  
  // Check environment
  if (!process.env.MERAKI_API_KEY) {
    console.error(`${colors.red}ERROR: MERAKI_API_KEY environment variable not set!${colors.reset}`);
    console.log('\nPlease ensure your Claude Desktop config includes:');
    console.log('"env": { "MERAKI_API_KEY": "your-api-key" }\n');
    process.exit(1);
  }
  
  console.log(`${colors.green}✓ API Key detected${colors.reset}`);
  console.log(`Starting tests...\n`);
  
  let orgId = null;
  let networkId = null;
  
  // Test 1: List Organizations
  const orgs = await testTool(
    'organization_list',
    {},
    'List all organizations accessible with the API key'
  );
  
  if (orgs && orgs.length > 0) {
    orgId = orgs[0].id;
    console.log(`  → Using organization: ${orgs[0].name} (${orgId})`);
  }
  
  // Add delay to respect rate limits
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Test 2: Get Organization Details
  if (orgId) {
    await testTool(
      'organization_get',
      { organizationId: orgId },
      'Get detailed information about the organization'
    );
  }
  
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Test 3: List Networks
  if (orgId) {
    const networks = await testTool(
      'organization_networks_list',
      { organizationId: orgId },
      'List all networks in the organization'
    );
    
    if (networks && networks.length > 0) {
      networkId = networks[0].id;
      console.log(`  → Using network: ${networks[0].name} (${networkId})`);
    }
  }
  
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Test 4: Organization Devices
  if (orgId) {
    await testTool(
      'organization_devices_list',
      { organizationId: orgId, perPage: 10 },
      'List devices in the organization (first 10)'
    );
  }
  
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Test 5: Device Statuses
  if (orgId) {
    await testTool(
      'organization_devices_statuses',
      { organizationId: orgId, perPage: 10 },
      'Get status of devices in the organization'
    );
  }
  
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Test 6: Licenses Overview
  if (orgId) {
    await testTool(
      'organization_licenses_overview',
      { organizationId: orgId },
      'Get licensing overview for the organization'
    );
  }
  
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Test 7: Network Details
  if (networkId) {
    await testTool(
      'network_get',
      { networkId },
      'Get detailed information about the network'
    );
  }
  
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Test 8: Network Devices
  if (networkId) {
    await testTool(
      'network_devices_list',
      { networkId },
      'List devices in the network'
    );
  }
  
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Test 9: Network Clients
  if (networkId) {
    await testTool(
      'network_clients_list',
      { networkId, timespan: 7200, perPage: 10 },
      'List clients in the network (last 2 hours)'
    );
  }
  
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Test 10: Network Traffic
  if (networkId) {
    await testTool(
      'network_traffic_get',
      { networkId, timespan: 7200 },
      'Get network traffic analysis (last 2 hours)'
    );
  }
  
  // Print summary
  console.log(`\n${colors.yellow}${'='.repeat(50)}${colors.reset}`);
  console.log(`${colors.yellow}📊 TEST SUMMARY${colors.reset}\n`);
  console.log(`Total Tests: ${results.summary.total}`);
  console.log(`${colors.green}Passed: ${results.summary.passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${results.summary.failed}${colors.reset}`);
  
  if (results.summary.failed > 0) {
    console.log(`\n${colors.red}Failed Tests:${colors.reset}`);
    results.tests
      .filter(t => t.status === 'failed')
      .forEach(t => console.log(`  - ${t.name}: ${t.error}`));
  }
  
  // Save results
  const reportPath = join(__dirname, 'test-results.json');
  await fs.writeFile(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n📄 Detailed results saved to: ${reportPath}`);
  
  // Exit with appropriate code
  process.exit(results.summary.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error(`${colors.red}Test suite crashed: ${error.message}${colors.reset}`);
  console.error(error.stack);
  process.exit(1);
});