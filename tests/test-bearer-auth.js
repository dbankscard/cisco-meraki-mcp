/**
 * Test script for Bearer authentication with fallback
 * 
 * This script tests:
 * 1. Bearer token authentication
 * 2. Fallback to legacy X-Cisco-Meraki-API-Key
 * 3. Device endpoints
 * 4. Analytics endpoints
 */

const axios = require('axios');

// Test configuration
const API_KEY = process.env.MERAKI_API_KEY;
const BASE_URL = 'https://api.meraki.com/api/v1';
const TEST_ORG_ID = process.env.TEST_ORG_ID || 'YOUR_ORG_ID';
const TEST_NETWORK_ID = process.env.TEST_NETWORK_ID || 'YOUR_NETWORK_ID';
const TEST_DEVICE_SERIAL = process.env.TEST_DEVICE_SERIAL || 'YOUR_DEVICE_SERIAL';

if (!API_KEY) {
  console.error('Please set MERAKI_API_KEY environment variable');
  process.exit(1);
}

// Test Bearer authentication
async function testBearerAuth() {
  console.log('\n=== Testing Bearer Authentication ===');
  
  try {
    const response = await axios.get(`${BASE_URL}/organizations`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    console.log('✅ Bearer authentication successful');
    console.log(`Found ${response.data.length} organizations`);
    return true;
  } catch (error) {
    console.error('❌ Bearer authentication failed:', error.response?.status, error.response?.data);
    return false;
  }
}

// Test legacy authentication
async function testLegacyAuth() {
  console.log('\n=== Testing Legacy Authentication ===');
  
  try {
    const response = await axios.get(`${BASE_URL}/organizations`, {
      headers: {
        'X-Cisco-Meraki-API-Key': API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    console.log('✅ Legacy authentication successful');
    console.log(`Found ${response.data.length} organizations`);
    return true;
  } catch (error) {
    console.error('❌ Legacy authentication failed:', error.response?.status, error.response?.data);
    return false;
  }
}

// Test device endpoints
async function testDeviceEndpoints() {
  console.log('\n=== Testing Device Endpoints ===');
  
  const endpoints = [
    {
      name: 'Get Device',
      method: 'GET',
      url: `/devices/${TEST_DEVICE_SERIAL}`,
    },
    {
      name: 'Get Device Clients',
      method: 'GET',
      url: `/devices/${TEST_DEVICE_SERIAL}/clients`,
      params: { timespan: 86400 }
    },
    {
      name: 'Get Device LLDP/CDP',
      method: 'GET',
      url: `/devices/${TEST_DEVICE_SERIAL}/lldpCdp`,
    },
    {
      name: 'Get Device Management Interface',
      method: 'GET',
      url: `/devices/${TEST_DEVICE_SERIAL}/managementInterface`,
    }
  ];
  
  for (const endpoint of endpoints) {
    try {
      const config = {
        method: endpoint.method,
        url: `${BASE_URL}${endpoint.url}`,
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        params: endpoint.params
      };
      
      const response = await axios(config);
      console.log(`✅ ${endpoint.name}: Success (${response.status})`);
    } catch (error) {
      console.error(`❌ ${endpoint.name}: Failed (${error.response?.status})`);
    }
  }
}

// Test analytics endpoints
async function testAnalyticsEndpoints() {
  console.log('\n=== Testing Analytics Endpoints ===');
  
  const endpoints = [
    {
      name: 'Organization Traffic Analysis',
      url: `/organizations/${TEST_ORG_ID}/summary/top/clients/byUsage`,
      params: { timespan: 86400 }
    },
    {
      name: 'Organization Applications Usage',
      url: `/organizations/${TEST_ORG_ID}/summary/top/applications/byUsage`,
      params: { timespan: 86400 }
    },
    {
      name: 'Organization API Usage',
      url: `/organizations/${TEST_ORG_ID}/apiRequests`,
      params: { timespan: 86400, perPage: 10 }
    },
    {
      name: 'Organization Device Statuses Overview',
      url: `/organizations/${TEST_ORG_ID}/devices/statuses/overview`,
    }
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await axios.get(`${BASE_URL}${endpoint.url}`, {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        params: endpoint.params
      });
      console.log(`✅ ${endpoint.name}: Success (${response.status})`);
    } catch (error) {
      console.error(`❌ ${endpoint.name}: Failed (${error.response?.status})`);
    }
  }
}

// Test authentication fallback
async function testAuthFallback() {
  console.log('\n=== Testing Authentication Fallback ===');
  
  // Simulate Bearer auth failure by using invalid format
  try {
    const response = await axios.get(`${BASE_URL}/organizations`, {
      headers: {
        'Authorization': 'InvalidBearer ' + API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    console.log('❌ Invalid bearer should have failed');
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Invalid bearer correctly rejected');
      
      // Now try with legacy auth
      try {
        const response = await axios.get(`${BASE_URL}/organizations`, {
          headers: {
            'X-Cisco-Meraki-API-Key': API_KEY,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
        console.log('✅ Fallback to legacy auth successful');
      } catch (error) {
        console.error('❌ Legacy auth fallback failed');
      }
    }
  }
}

// Run all tests
async function runTests() {
  console.log('Starting Meraki API Tests...');
  console.log('API Key:', API_KEY.substring(0, 10) + '...');
  console.log('Base URL:', BASE_URL);
  
  // Test authentication methods
  const bearerWorks = await testBearerAuth();
  const legacyWorks = await testLegacyAuth();
  
  if (!bearerWorks && !legacyWorks) {
    console.error('\n❌ Both authentication methods failed. Check your API key.');
    return;
  }
  
  // Test endpoints if auth works
  if (bearerWorks || legacyWorks) {
    await testDeviceEndpoints();
    await testAnalyticsEndpoints();
    await testAuthFallback();
  }
  
  console.log('\n=== Test Summary ===');
  console.log(`Bearer Auth: ${bearerWorks ? '✅' : '❌'}`);
  console.log(`Legacy Auth: ${legacyWorks ? '✅' : '❌'}`);
  console.log('\nTests completed!');
}

// Run the tests
runTests().catch(console.error);