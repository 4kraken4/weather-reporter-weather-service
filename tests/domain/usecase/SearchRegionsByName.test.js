/**
 * Test suite for SearchRegionsByName use case
 * 
 * Tests the actual implementation which:
 * - Uses regionRepository.searchByName with specific search options
 * - Fetches country data from RestCountries API for enrichment 
 * - Uses two circuit breakers (one for DB, one for RestCountries)
 * - Returns structured response with countries lookup object
 * - Validates partialName with complex regex and country codes
 * - Handles country data enrichment and error scenarios
 */

import Region from '../../../src/domain/entities/Region.js';
import SearchRegionsByName from '../../../src/domain/usecases/SearchRegionsByName.js';

// Mock the circuit breaker
jest.mock('../../../src/utils/CircuiteBreaker.js', () => ({
  getCircuitBreakerInstance: jest.fn()
}));

import { getCircuitBreakerInstance } from '../../../src/utils/CircuiteBreaker.js';

describe('SearchRegionsByName', () => {
  let regionRepository;
  let searchRegionsByName;
  let mockDbCircuitBreaker;
  let mockRestCountriesCircuitBreaker;

  beforeEach(() => {
    regionRepository = {
      searchByName: jest.fn()
    };
    searchRegionsByName = new SearchRegionsByName(regionRepository);

    // Mock circuit breakers
    mockDbCircuitBreaker = {
      fire: jest.fn()
    };
    mockRestCountriesCircuitBreaker = {
      fire: jest.fn()
    };

    // Setup circuit breaker mock to return different instances
    getCircuitBreakerInstance.mockImplementation((fn, name) => {
      if (name && name.includes('mongo')) {
        return mockDbCircuitBreaker;
      } else if (name && name.includes('restCountries')) {
        return mockRestCountriesCircuitBreaker;
      }
      return mockDbCircuitBreaker; // Default fallback
    });

    jest.clearAllMocks();
  });

  afterAll(async () => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe('execute()', () => {
    it('should return search results with country enrichment', async () => {
      const mockResults = [
        {
          id: 1,
          name: 'London',
          country: 'gb',
          state: 'England',
          coord: { lat: 51.5074, lon: -0.1278 }
        },
        {
          id: 2,
          name: 'London',
          country: 'ca',
          state: 'Ontario',
          coord: { lat: 42.9849, lon: -81.2453 }
        }
      ];

      const mockCountriesData = [
        {
          code: 'gb',
          name: 'united kingdom',
          population: 67000000,
          region: 'europe',
          subregion: 'northern europe',
          capital: 'London',
          flags: {
            png: 'https://flagcdn.com/gb.png',
            svg: 'https://flagcdn.com/gb.svg',
            alt: 'Flag of United Kingdom'
          },
          maps: {
            openStreetMaps: 'https://www.openstreetmaps.org/relation/62149'
          }
        },
        {
          code: 'ca',
          name: 'canada',
          population: 38000000,
          region: 'americas',
          subregion: 'northern america',
          capital: 'Ottawa',
          flags: {
            png: 'https://flagcdn.com/ca.png',
            svg: 'https://flagcdn.com/ca.svg',
            alt: 'Flag of Canada'
          },
          maps: {
            openStreetMaps: 'https://www.openstreetmaps.org/relation/1428125'
          }
        }
      ];

      mockDbCircuitBreaker.fire.mockResolvedValue({
        results: mockResults,
        totalCount: 2
      });

      mockRestCountriesCircuitBreaker.fire.mockResolvedValue(mockCountriesData);

      const searchParams = {
        partialName: 'London',
        page: 1,
        pageSize: 10
      };

      const result = await searchRegionsByName.execute(searchParams);

      expect(result).toEqual({
        success: true,
        searchTerm: 'London',
        pagination: {
          currentPage: 1,
          pageSize: 10,
          totalItems: 2,
          totalPages: 1
        },
        countries: {
          gb: {
            name: 'united kingdom',
            flagUrl: 'https://flagcdn.com/gb.svg',
            mapUrl: 'https://www.openstreetmaps.org/relation/62149',
            region: 'europe',
            subregion: 'northern europe'
          },
          ca: {
            name: 'canada',
            flagUrl: 'https://flagcdn.com/ca.svg',
            mapUrl: 'https://www.openstreetmaps.org/relation/1428125',
            region: 'americas',
            subregion: 'northern america'
          }
        },
        suggestions: expect.arrayContaining([
          expect.any(Region),
          expect.any(Region)
        ])
      });

      expect(mockDbCircuitBreaker.fire).toHaveBeenCalledWith({
        partialName: 'london',
        page: 1,
        pageSize: 10,
        country: null,
        sortBy: 'population'
      });

      expect(mockRestCountriesCircuitBreaker.fire).toHaveBeenCalledWith(['gb', 'ca']);
    });

    it('should handle pagination parameters correctly', async () => {
      mockDbCircuitBreaker.fire.mockResolvedValue({
        results: [],
        totalCount: 100
      });

      const searchParams = {
        partialName: 'test',
        page: 3,
        pageSize: 20
      };

      const result = await searchRegionsByName.execute(searchParams);

      expect(result.pagination).toEqual({
        currentPage: 3,
        pageSize: 20,
        totalItems: 100,
        totalPages: 5
      });
    });

    it('should limit page size to maximum 50', async () => {
      mockDbCircuitBreaker.fire.mockResolvedValue({
        results: [],
        totalCount: 0
      });

      const searchParams = {
        partialName: 'test',
        pageSize: 100
      };

      await searchRegionsByName.execute(searchParams);

      expect(mockDbCircuitBreaker.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          pageSize: 50
        })
      );
    });

    it('should enforce minimum page number of 1', async () => {
      mockDbCircuitBreaker.fire.mockResolvedValue({
        results: [],
        totalCount: 0
      });

      const searchParams = {
        partialName: 'test',
        page: -5
      };

      await searchRegionsByName.execute(searchParams);

      expect(mockDbCircuitBreaker.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1
        })
      );
    });

    it('should validate search term format and throw InvalidSearchTermError', async () => {
      const invalidSearchTerms = [
        '  ', // whitespace only (becomes empty after trim)
        'a  b', // double spaces
        'test@', // special characters not allowed
        'test..test', // double dots
        'test,,test', // double commas
        '',  // empty
        '   ', // multiple spaces (becomes empty after trim)
        '@test', // starts with special character
        'test@end', // ends with special character
        '@', // single special character
        '@@', // multiple special characters
      ];

      for (const invalidTerm of invalidSearchTerms) {
        const searchParams = { partialName: invalidTerm };

        await expect(searchRegionsByName.execute(searchParams))
          .rejects
          .toThrow('InvalidSearchTermError');
      }
    });

    it('should accept valid search terms', async () => {
      mockDbCircuitBreaker.fire.mockResolvedValue({
        results: [],
        totalCount: 0
      });

      const validSearchTerms = [
        'A', // single character is valid
        'London',
        'New York',
        'Los Angeles',
        'San Francisco',
        'AB', // minimum length (2 alphanumeric chars)
        'A1', // alphanumeric
        'test-test', // single dash allowed
        'test.test', // single dot allowed
        'test,test', // single comma allowed
        "test'test", // single apostrophe allowed
        'test`test', // single backtick allowed
      ];

      for (const validTerm of validSearchTerms) {
        const searchParams = { partialName: validTerm };

        await expect(searchRegionsByName.execute(searchParams))
          .resolves
          .toMatchObject({ success: true });
      }
    });

    it('should validate country code format', async () => {
      const invalidCountryCodes = [
        'A', // too short
        'ABC', // too long
        '12', // numbers
        'A1', // mixed alphanumeric
        'a-', // special characters
        'USA', // 3 characters
        'GB1', // contains number
        'G@', // special character
      ];

      for (const invalidCode of invalidCountryCodes) {
        const searchParams = {
          partialName: 'London',
          country: invalidCode
        };

        await expect(searchRegionsByName.execute(searchParams))
          .rejects
          .toThrow('InvalidCountryCodeError');
      }
    });

    it('should accept valid country codes', async () => {
      mockDbCircuitBreaker.fire.mockResolvedValue({
        results: [],
        totalCount: 0
      });

      const validCountryCodes = [
        'GB', // uppercase
        'US', // uppercase
        'CA', // uppercase
        'FR', // uppercase
        'DE', // uppercase
        'LK', // Sri Lanka
        'IN', // India
        'AU', // Australia
        'ab', // lowercase
        'xy', // any two letters
        ' GB ', // with spaces (trimmed)
        '  US  ', // multiple spaces (trimmed)
        '\tCA\t', // tabs (trimmed)
      ];

      for (const validCode of validCountryCodes) {
        const searchParams = {
          partialName: 'London',
          country: validCode
        };

        await expect(searchRegionsByName.execute(searchParams))
          .resolves
          .toMatchObject({ success: true });
      }
    });

    it('should allow null, undefined, or empty country code', async () => {
      mockDbCircuitBreaker.fire.mockResolvedValue({
        results: [],
        totalCount: 0
      });

      // Test null country
      await expect(searchRegionsByName.execute({
        partialName: 'London',
        country: null
      })).resolves.toMatchObject({ success: true });

      // Test undefined country
      await expect(searchRegionsByName.execute({
        partialName: 'London'
      })).resolves.toMatchObject({ success: true });

      // Test empty string
      await expect(searchRegionsByName.execute({
        partialName: 'London',
        country: ''
      })).resolves.toMatchObject({ success: true });

      // Test whitespace only
      await expect(searchRegionsByName.execute({
        partialName: 'London',
        country: '  '
      })).resolves.toMatchObject({ success: true });
    });

    it('should handle repository errors and throw RegionSearchError', async () => {
      mockDbCircuitBreaker.fire.mockRejectedValue(new Error('Database connection failed'));

      const searchParams = {
        partialName: 'London'
      };

      await expect(searchRegionsByName.execute(searchParams))
        .rejects
        .toThrow('RegionSearchError');
    });

    it('should handle RestCountries API errors and throw RegionSearchError', async () => {
      const mockResults = [
        {
          id: 1,
          name: 'London',
          country: 'gb',
          state: 'England',
          coord: { lat: 51.5074, lon: -0.1278 }
        }
      ];

      mockDbCircuitBreaker.fire.mockResolvedValue({
        results: mockResults,
        totalCount: 1
      });

      mockRestCountriesCircuitBreaker.fire.mockRejectedValue(new Error('RestCountries API failed'));

      const searchParams = {
        partialName: 'London'
      };

      await expect(searchRegionsByName.execute(searchParams))
        .rejects
        .toThrow('RegionSearchError');
    });

    it('should lowercase the search term', async () => {
      mockDbCircuitBreaker.fire.mockResolvedValue({
        results: [],
        totalCount: 0
      });

      const searchParams = {
        partialName: 'LONDON'
      };

      await searchRegionsByName.execute(searchParams);

      expect(mockDbCircuitBreaker.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          partialName: 'london'
        })
      );
    });

    it('should pass correct search options to repository', async () => {
      mockDbCircuitBreaker.fire.mockResolvedValue({
        results: [],
        totalCount: 0
      });

      const searchParams = {
        partialName: 'London',
        country: 'GB',
        sortBy: 'name'
      };

      await searchRegionsByName.execute(searchParams);

      expect(mockDbCircuitBreaker.fire).toHaveBeenCalledWith({
        partialName: 'london',
        page: 1,
        pageSize: 10,
        country: 'GB',
        sortBy: 'name'
      });
    });

    it('should handle empty results without country enrichment', async () => {
      mockDbCircuitBreaker.fire.mockResolvedValue({
        results: [],
        totalCount: 0
      });

      const searchParams = {
        partialName: 'NonexistentCity'
      };

      const result = await searchRegionsByName.execute(searchParams);

      expect(result).toEqual({
        success: true,
        searchTerm: 'NonexistentCity',
        pagination: {
          currentPage: 1,
          pageSize: 10,
          totalItems: 0,
          totalPages: 0
        },
        countries: {},
        suggestions: []
      });

      // Should not call RestCountries API when no results
      expect(mockRestCountriesCircuitBreaker.fire).not.toHaveBeenCalled();
    });

    it('should handle CountryNotFoundError when RestCountries returns empty data', async () => {
      const mockResults = [
        {
          id: 1,
          name: 'London',
          country: 'gb',
          state: 'England',
          coord: { lat: 51.5074, lon: -0.1278 }
        }
      ];

      mockDbCircuitBreaker.fire.mockResolvedValue({
        results: mockResults,
        totalCount: 1
      });

      // RestCountries returns empty array
      mockRestCountriesCircuitBreaker.fire.mockResolvedValue([]);

      const searchParams = {
        partialName: 'London'
      };

      await expect(searchRegionsByName.execute(searchParams))
        .rejects
        .toThrow('RegionSearchError');
    });

    it('should update cities with country data correctly', async () => {
      const mockResults = [
        {
          id: 1,
          name: 'London',
          country: 'gb',
          state: 'England',
          coord: { lat: 51.5074, lon: -0.1278 }
        }
      ];

      const mockCountriesData = [
        {
          code: 'gb',
          name: 'united kingdom',
          flags: { svg: 'https://flagcdn.com/gb.svg' },
          maps: { openStreetMaps: 'https://openstreetmaps.org/gb' },
          region: 'europe',
          subregion: 'northern europe'
        }
      ];

      mockDbCircuitBreaker.fire.mockResolvedValue({
        results: mockResults,
        totalCount: 1
      });

      mockRestCountriesCircuitBreaker.fire.mockResolvedValue(mockCountriesData);

      const result = await searchRegionsByName.execute({
        partialName: 'London'
      });

      // Check that city was updated with country name and countryCode
      expect(result.suggestions[0]).toBeInstanceOf(Region);
      expect(result.suggestions[0].countryCode).toBe('gb'); // Should be countryCode in Region

      // Check countries lookup
      expect(result.countries.gb).toEqual({
        name: 'united kingdom',
        flagUrl: 'https://flagcdn.com/gb.svg',
        mapUrl: 'https://openstreetmaps.org/gb',
        region: 'europe',
        subregion: 'northern europe'
      });
    });

    it('should deduplicate country codes from results', async () => {
      const mockResults = [
        {
          id: 1,
          name: 'London',
          country: 'gb',
          state: 'England',
          coord: { lat: 51.5074, lon: -0.1278 }
        },
        {
          id: 2,
          name: 'Manchester',
          country: 'gb', // Same country
          state: 'England',
          coord: { lat: 53.4808, lon: -2.2426 }
        }
      ];

      const mockCountriesData = [
        {
          code: 'gb',
          name: 'united kingdom',
          flags: { svg: 'https://flagcdn.com/gb.svg' },
          maps: { openStreetMaps: 'https://openstreetmaps.org/gb' },
          region: 'europe',
          subregion: 'northern europe'
        }
      ];

      mockDbCircuitBreaker.fire.mockResolvedValue({
        results: mockResults,
        totalCount: 2
      });

      mockRestCountriesCircuitBreaker.fire.mockResolvedValue(mockCountriesData);

      await searchRegionsByName.execute({
        partialName: 'test'
      });

      // Should only call RestCountries once with unique country codes
      expect(mockRestCountriesCircuitBreaker.fire).toHaveBeenCalledWith(['gb']);
    });
  });

  describe('Country filtering', () => {
    it('should filter by country when country parameter provided', async () => {
      mockDbCircuitBreaker.fire.mockResolvedValue({
        results: [],
        totalCount: 0
      });

      await searchRegionsByName.execute({
        partialName: 'London',
        country: 'GB'
      });

      expect(mockDbCircuitBreaker.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          country: 'GB'
        })
      );
    });

    it('should search globally when no country specified', async () => {
      mockDbCircuitBreaker.fire.mockResolvedValue({
        results: [],
        totalCount: 0
      });

      await searchRegionsByName.execute({
        partialName: 'London'
      });

      expect(mockDbCircuitBreaker.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          country: null
        })
      );
    });

    it('should handle country codes in different cases', async () => {
      mockDbCircuitBreaker.fire.mockResolvedValue({
        results: [],
        totalCount: 0
      });

      await searchRegionsByName.execute({
        partialName: 'Paris',
        country: 'fr'
      });

      expect(mockDbCircuitBreaker.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          country: 'fr'
        })
      );
    });
  });

  describe('Pagination and limits', () => {
    it('should enforce maximum page size of 50', async () => {
      mockDbCircuitBreaker.fire.mockResolvedValue({
        results: [],
        totalCount: 0
      });

      await searchRegionsByName.execute({
        partialName: 'test',
        pageSize: 999
      });

      expect(mockDbCircuitBreaker.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          pageSize: 50
        })
      );
    });

    it('should enforce minimum page size of 1', async () => {
      mockDbCircuitBreaker.fire.mockResolvedValue({
        results: [],
        totalCount: 0
      });

      await searchRegionsByName.execute({
        partialName: 'test',
        pageSize: -5
      });

      expect(mockDbCircuitBreaker.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          pageSize: 1
        })
      );
    });

    it('should calculate total pages correctly', async () => {
      mockDbCircuitBreaker.fire.mockResolvedValue({
        results: [],
        totalCount: 47
      });

      const result = await searchRegionsByName.execute({
        partialName: 'test',
        pageSize: 10
      });

      expect(result.pagination.totalPages).toBe(5); // Math.ceil(47/10)
    });
  });

  describe('Error scenarios', () => {
    it('should throw RegionSearchError for any database errors', async () => {
      mockDbCircuitBreaker.fire.mockRejectedValue(new Error('Connection timeout'));

      await expect(searchRegionsByName.execute({
        partialName: 'London'
      })).rejects.toThrow('RegionSearchError');
    });

    it('should throw RegionSearchError for RestCountries failures', async () => {
      mockDbCircuitBreaker.fire.mockResolvedValue({
        results: [{ id: 1, name: 'London', country: 'gb', state: 'England', coord: {} }],
        totalCount: 1
      });

      mockRestCountriesCircuitBreaker.fire.mockRejectedValue(new Error('API rate limit'));

      await expect(searchRegionsByName.execute({
        partialName: 'London'
      })).rejects.toThrow('RegionSearchError');
    });

    it('should throw RegionSearchError when RestCountries returns empty data', async () => {
      mockDbCircuitBreaker.fire.mockResolvedValue({
        results: [{ id: 1, name: 'London', country: 'gb', state: 'England', coord: {} }],
        totalCount: 1
      });

      mockRestCountriesCircuitBreaker.fire.mockResolvedValue([]);

      await expect(searchRegionsByName.execute({
        partialName: 'London'
      })).rejects.toThrow('RegionSearchError');
    });
  });
});
