#!/usr/bin/env node

import { optimizeResponse, createSummaryResponse, formatToolResponse } from '../build/utils/response-optimizer.js';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`${colors.green}✓${colors.reset} ${name}`);
    passed++;
  } catch (error) {
    console.log(`${colors.red}✗${colors.reset} ${name}`);
    console.log(`  ${colors.red}${error.message}${colors.reset}`);
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

console.log(`${colors.yellow}Response Optimization Test Suite${colors.reset}\n`);

// Test 1: Array truncation
test('Array truncation at limit', () => {
  const largeArray = Array(150).fill(0).map((_, i) => ({ id: i, name: `Item ${i}` }));
  const optimized = optimizeResponse(largeArray, { maxArrayLength: 100 });
  
  assert(optimized.data.length === 100, 'Array should be truncated to 100 items');
  assert(optimized._meta.totalCount === 150, 'Meta should show total count');
  assert(optimized._meta.truncated === true, 'Meta should indicate truncation');
});

// Test 2: String truncation
test('String truncation', () => {
  const longString = 'a'.repeat(2000);
  const data = { description: longString };
  const optimized = optimizeResponse(data, { 
    truncateLongStrings: true, 
    maxStringLength: 500 
  });
  
  assert(optimized.description.includes('[truncated]'), 'String should be truncated');
  assert(optimized.description.length < 520, 'String length should be limited');
});

// Test 3: Null field removal
test('Null field removal', () => {
  const data = {
    id: 1,
    name: 'Test',
    description: null,
    value: undefined,
    active: true
  };
  const optimized = optimizeResponse(data, { removeNullFields: true });
  
  assert(!('description' in optimized), 'Null fields should be removed');
  assert(!('value' in optimized), 'Undefined fields should be removed');
  assert(optimized.active === true, 'Non-null fields should remain');
});

// Test 4: Summary response creation
test('Summary response for large arrays', () => {
  const devices = Array(100).fill(0).map((_, i) => ({
    name: `Device ${i}`,
    model: i % 3 === 0 ? 'MX84' : i % 3 === 1 ? 'MS225' : 'MR44',
    serial: `Q2QN-${i}`,
    status: i % 10 === 0 ? 'offline' : 'online'
  }));
  
  const summary = createSummaryResponse(devices, ['model', 'status']);
  
  assert(summary.totalCount === 100, 'Should show total count');
  assert(summary.firstItems.length === 5, 'Should include first 5 items');
  assert(summary.summary.model.uniqueCount === 3, 'Should count unique models');
  assert(summary.summary.status.uniqueCount === 2, 'Should count unique statuses');
});

// Test 5: Tool-specific response formatting
test('Tool-specific formatting for network_clients_list', () => {
  const clients = Array(60).fill(0).map((_, i) => ({
    id: i,
    description: `Client ${i}`,
    mac: `00:00:00:00:00:${i.toString(16).padStart(2, '0')}`,
    ip: `192.168.1.${i}`,
    vlan: i % 3 + 1,
    status: 'Online',
    usage: { sent: 1000 * i, received: 2000 * i }
  }));
  
  const formatted = JSON.parse(formatToolResponse(clients, 'network_clients_list'));
  
  assert(formatted.totalCount === 60, 'Should show total count');
  assert(formatted.firstItems.length === 5, 'Should show sample items');
  assert(formatted.summary.vlan, 'Should include VLAN summary');
});

// Test 6: Tool-specific formatting for organization_devices_list
test('Tool-specific formatting for organization_devices_list', () => {
  const devices = Array(80).fill(0).map((_, i) => ({
    name: `Device ${i}`,
    model: ['MX84', 'MS225', 'MR44'][i % 3],
    serial: `QQQQ-${i}`,
    status: i % 5 === 0 ? 'offline' : 'online',
    networkId: `N_${Math.floor(i / 10)}`
  }));
  
  const formatted = JSON.parse(formatToolResponse(devices, 'organization_devices_list'));
  
  assert(formatted.summary.model, 'Should include model summary');
  assert(formatted.summary.status, 'Should include status summary');
  assert(formatted.summary.networkId, 'Should include networkId summary');
});

// Test 7: Nested array handling
test('Nested array optimization', () => {
  const data = {
    networks: Array(10).fill(0).map((_, i) => ({
      id: i,
      name: `Network ${i}`,
      devices: Array(20).fill(0).map((_, j) => ({ id: j, name: `Device ${j}` }))
    }))
  };
  
  const optimized = optimizeResponse(data, { maxArrayLength: 5 });
  
  assert(optimized.networks.data.length === 5, 'Top-level array should be truncated');
  assert(optimized.networks._meta.totalCount === 10, 'Should show total networks');
  // Nested arrays should also be optimized
  assert(optimized.networks.data[0].devices.data.length === 5, 'Nested arrays should be truncated');
});

// Test 8: Response with existing meta
test('Response with existing meta should not be re-optimized', () => {
  const data = {
    data: [1, 2, 3],
    meta: {
      total: 100,
      returned: 3,
      truncated: true
    }
  };
  
  const formatted = formatToolResponse(data, 'network_clients_list');
  const parsed = JSON.parse(formatted);
  
  assert(parsed.meta.total === 100, 'Should preserve existing meta');
  assert(!parsed._meta, 'Should not add duplicate meta');
});

// Test 9: Empty data handling
test('Empty array handling', () => {
  const emptyArray = [];
  const optimized = optimizeResponse(emptyArray);
  
  assert(Array.isArray(optimized), 'Empty array should remain array');
  assert(optimized.length === 0, 'Empty array should stay empty');
});

// Test 10: Performance with large dataset
test('Performance with large dataset', () => {
  const start = Date.now();
  const hugeArray = Array(10000).fill(0).map((_, i) => ({
    id: i,
    data: 'x'.repeat(100),
    nested: { value: i }
  }));
  
  const optimized = optimizeResponse(hugeArray, { maxArrayLength: 50 });
  const duration = Date.now() - start;
  
  assert(duration < 100, `Should optimize in <100ms (took ${duration}ms)`);
  assert(optimized.data.length === 50, 'Should truncate to specified limit');
});

// Test 11: Mixed data types
test('Mixed data type optimization', () => {
  const mixedData = {
    string: 'test',
    number: 123,
    boolean: true,
    array: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    object: { a: 1, b: null, c: 'test' },
    nullValue: null,
    longString: 'x'.repeat(2000)
  };
  
  const optimized = optimizeResponse(mixedData, {
    maxArrayLength: 5,
    truncateLongStrings: true,
    maxStringLength: 100,
    removeNullFields: true
  });
  
  assert(optimized.array.data.length === 5, 'Array should be truncated');
  assert(!('nullValue' in optimized), 'Null value should be removed');
  assert(optimized.longString.includes('[truncated]'), 'Long string should be truncated');
});

// Test 12: Special handling for events
test('Special handling for network_events_list', () => {
  const eventsResponse = {
    events: Array(100).fill(0).map((_, i) => ({
      type: ['dhcp_alert', 'vpn_connectivity_change', 'client_vpn_connect'][i % 3],
      category: ['security', 'connectivity', 'client'][i % 3],
      occurredAt: new Date(Date.now() - i * 60000).toISOString(),
      description: `Event ${i}`
    })),
    pageStartAt: new Date().toISOString(),
    pageEndAt: new Date(Date.now() - 3600000).toISOString()
  };
  
  const formatted = JSON.parse(formatToolResponse(eventsResponse, 'network_events_list'));
  
  assert(formatted.events.totalCount === 100, 'Should show total events');
  assert(formatted.events.summary.type, 'Should include type summary');
  assert(formatted.pageStartAt, 'Should preserve pagination info');
});

// Summary
console.log(`\n${colors.yellow}Summary:${colors.reset}`);
console.log(`${colors.green}Passed: ${passed}${colors.reset}`);
console.log(`${colors.red}Failed: ${failed}${colors.reset}`);
console.log(`Total: ${passed + failed}`);

process.exit(failed > 0 ? 1 : 0);