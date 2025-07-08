#!/usr/bin/env node

/**
 * Manual test script for the bulk weather API
 * Usage: node scripts/test-bulk-weather.js
 */

import axios from 'axios';

import UrlUtils from '../src/utils/UrlUtils.js';

// Build API base URL using UrlUtils
const DEFAULT_CONFIG = {
  protocol: 'http',
  host: 'localhost',
  port: 9001,
  routePrefix: 'api/v1/weather'
};

const API_BASE_URL =
  process.env.API_BASE_URL || UrlUtils.buildServiceBaseUrl(DEFAULT_CONFIG, false);

const testBulkWeather = async () => {
  console.log('🌤️  Testing Bulk Weather API...\n');

  const testCases = [
    {
      name: 'Valid Cities Test',
      cities: [
        { city: 'London', country: 'GB' },
        { city: 'New York', country: 'US' },
        { city: 'Tokyo', country: 'JP' },
        { city: 'Sydney', country: 'AU' }
      ]
    },
    {
      name: 'Mixed Valid/Invalid Cities Test',
      cities: [
        { city: 'Paris', country: 'FR' },
        { city: 'InvalidCityName123', country: 'XX' },
        { city: 'Berlin', country: 'DE' }
      ]
    },
    {
      name: 'Cities Without Country Code',
      cities: [{ city: 'Mumbai' }, { city: 'Moscow' }, { city: 'Cairo' }]
    }
  ];

  const testPromises = testCases.map(async testCase => {
    console.log(`\n📋 Running: ${testCase.name}`);
    console.log(
      `📍 Cities: ${testCase.cities.map(c => `${c.city}${c.country ? `, ${c.country}` : ''}`).join(' | ')}`
    );

    try {
      const startTime = Date.now();

      const bulkEndpointUrl = UrlUtils.buildEndpointUrl(API_BASE_URL, 'bulk');

      const response = await axios.post(bulkEndpointUrl, {
        cities: testCase.cities
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`✅ Success (${duration}ms)`);
      console.log(`📊 Results: ${Object.keys(response.data.data).length} cities`);

      // Display weather data
      for (const [cacheKey, weather] of Object.entries(response.data.data)) {
        console.log(
          `   🌡️  ${cacheKey}: ${weather.temperature}°C - ${weather.description}`
        );
      }
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Message: ${error.response.data.message || 'Unknown error'}`);
      }
    }
  });

  await Promise.all(testPromises);

  // Test error cases
  console.log('\n🚫 Testing Error Cases...\n');

  const errorTests = [
    {
      name: 'Empty Cities Array',
      data: { cities: [] }
    },
    {
      name: 'Missing Cities Property',
      data: {}
    },
    {
      name: 'Too Many Cities',
      data: { cities: Array(51).fill({ city: 'London', country: 'GB' }) }
    }
  ];

  const errorTestPromises = errorTests.map(async errorTest => {
    console.log(`📋 Testing: ${errorTest.name}`);

    try {
      await axios.post(`${API_BASE_URL}/api/v1/weather/bulk`, errorTest.data);
      console.log(`❌ Expected error but got success`);
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log(`✅ Correctly returned 400: ${error.response.data.message}`);
      } else {
        console.log(`❌ Unexpected error: ${error.message}`);
      }
    }
  });

  await Promise.all(errorTestPromises);
};

console.log('\n🎉 Bulk Weather API testing completed!');

// Test cache functionality
const testCaching = async () => {
  console.log('\n🗄️  Testing Cache Functionality...\n');

  const cities = [
    { city: 'London', country: 'GB' },
    { city: 'Paris', country: 'FR' }
  ];

  try {
    console.log('📍 First request (should fetch from API)...');
    const start1 = Date.now();
    const response1 = await axios.post(`${API_BASE_URL}/api/v1/weather/bulk`, {
      cities
    });
    const duration1 = Date.now() - start1;
    console.log(`✅ First request completed in ${duration1}ms`);

    console.log('📍 Second request (should use cache)...');
    const start2 = Date.now();
    const response2 = await axios.post(`${API_BASE_URL}/api/v1/weather/bulk`, {
      cities
    });
    const duration2 = Date.now() - start2;
    console.log(`✅ Second request completed in ${duration2}ms`);

    if (duration2 < duration1) {
      console.log('🚀 Cache working! Second request was faster.');
    } else {
      console.log('⚠️  Cache might not be working as expected.');
    }

    // Compare results
    const keys1 = Object.keys(response1.data.data);
    const keys2 = Object.keys(response2.data.data);

    if (keys1.length === keys2.length && keys1.every(key => keys2.includes(key))) {
      console.log('✅ Cache results are consistent');
    } else {
      console.log('❌ Cache results differ from original');
    }
  } catch (error) {
    console.log(`❌ Cache test failed: ${error.message}`);
  }
};

const main = async () => {
  console.log('🌦️  Bulk Weather API Test Suite');
  console.log('=================================\n');

  try {
    await testBulkWeather();
    await testCaching();
  } catch (error) {
    console.error('Test suite failed:', error.message);
    process.exit(1);
  }
};

main();
