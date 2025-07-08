/**
 * Script to demonstrate the data deduplication improvement in SearchRegionsByName
 * This script shows the before/after response structure and data size reduction
 */

import SearchRegionsByName from '../src/domain/usecases/SearchRegionsByName.js';

// Mock region repository with sample data
const mockRegionRepository = {
  searchByName: async _searchOptions => {
    // Sample data simulating multiple Indian cities
    const results = [
      {
        id: 1264521,
        name: 'Madurai',
        country: 'in',
        stat: { population: 909908 },
        coord: { lon: 78.116669, lat: 9.93333 }
      },
      {
        id: 1263965,
        name: 'Manamadurai',
        country: 'in',
        stat: { population: 27493 },
        coord: { lon: 78.48333, lat: 9.7 }
      },
      {
        id: 1253595,
        name: 'Vadamadurai',
        country: 'in',
        stat: { population: 15886 },
        coord: { lon: 78.083328, lat: 10.46667 }
      }
    ];

    return {
      results,
      totalCount: results.length
    };
  }
};

// Mock RestCountries API response
const mockRestCountriesResponse = [
  {
    data: [
      {
        cca2: 'IN',
        name: { common: 'India' },
        population: 1380004385,
        region: 'Asia',
        subregion: 'Southern Asia',
        capital: ['New Delhi'],
        flags: {
          png: 'https://flagcdn.com/in.png',
          svg: 'https://flagcdn.com/in.svg',
          alt: 'Flag of India'
        },
        maps: {
          openStreetMaps: 'https://www.openstreetmap.org/relation/304716'
        }
      }
    ]
  }
];

// Mock the RestCountries service
jest.mock('../src/interfaces/services/rest-countries/RestCountries.js', () => ({
  RestCountries: {
    getCountryByCode: jest.fn().mockResolvedValue(mockRestCountriesResponse[0])
  }
}));

// Mock circuit breaker
jest.mock('../src/utils/CircuiteBreaker.js', () => ({
  getCircuitBreakerInstance: jest.fn().mockImplementation(fn => ({
    fire: fn
  }))
}));

// Mock config
jest.mock('../src/config/Config.js', () => ({
  default: {
    getInstance: () => ({
      db: { mongo: { name: 'test-db' } },
      apis: { restCountries: { name: 'rest-countries' } }
    })
  }
}));

async function demonstrateDeduplication() {
  console.log('=== SearchRegionsByName Data Deduplication Demo ===\n');

  const searchRegionsByName = new SearchRegionsByName(mockRegionRepository);

  try {
    const result = await searchRegionsByName.execute({
      partialName: 'madurai',
      page: 1,
      pageSize: 10
    });

    console.log('NEW RESPONSE STRUCTURE (with deduplication):');
    console.log(JSON.stringify(result, null, 2));

    // Calculate data sizes
    const newStructureSize = JSON.stringify(result).length;

    // Simulate old structure for comparison
    const oldStructure = {
      ...result,
      suggestions: result.suggestions.map(city => ({
        ...city,
        flagUrl: result.countries[city.countryCode]?.flagUrl,
        mapUrl: result.countries[city.countryCode]?.mapUrl
      }))
    };
    delete oldStructure.countries;

    const oldStructureSize = JSON.stringify(oldStructure).length;

    console.log('\n=== SIZE COMPARISON ===');
    console.log(`Old structure size: ${oldStructureSize} bytes`);
    console.log(`New structure size: ${newStructureSize} bytes`);
    console.log(
      `Data reduction: ${oldStructureSize - newStructureSize} bytes (${(((oldStructureSize - newStructureSize) / oldStructureSize) * 100).toFixed(1)}%)`
    );

    console.log('\n=== BENEFITS ===');
    console.log('✓ Eliminated duplication of country-level data (flagUrl, mapUrl)');
    console.log('✓ Reduced response size');
    console.log('✓ Better data structure for caching');
    console.log('✓ Easier to maintain country metadata');
    console.log(
      '✓ Client can still reconstruct full data by joining countries[countryCode]'
    );
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run the demonstration if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  demonstrateDeduplication();
}

export { demonstrateDeduplication };

