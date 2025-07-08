import Weather from '../../../src/domain/entities/Weather.js';
import GetCurrentWeatherByRegionName from '../../../src/domain/usecases/GetCurrentWeatherByRegionName.js';
import { OpenWeather } from '../../../src/interfaces/services/open-weather/OpenWeather.js';

// Mock the OpenWeather service
jest.mock('../../../src/interfaces/services/open-weather/OpenWeather.js', () => ({
  OpenWeather: {
    getCurrentWeather: jest.fn()
  }
}));

// Mock the database connection
jest.mock('../../../db/mongoose.js', () => ({
  connectWithResilience: jest.fn().mockResolvedValue(true),
  mongoose: {
    connection: {
      readyState: 0,
      close: jest.fn().mockResolvedValue(true)
    }
  }
}));

describe('GetCurrentWeatherByRegionName', () => {
  let regionRepository;
  let getCurrentWeatherByRegionName;

  beforeEach(() => {
    regionRepository = {
      getRegionFromName: jest.fn()
    };
    getCurrentWeatherByRegionName = new GetCurrentWeatherByRegionName(regionRepository);

    jest.clearAllMocks();
  });

  afterAll(async () => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe('execute()', () => {
    it('should return weather data for valid region and country code', async () => {
      const mockRegionData = {
        id: 2643743,
        name: 'London',
        country: 'GB',
        population: 8900000
      };

      const mockWeatherResponse = {
        data: {
          coord: { lon: -0.1257, lat: 51.5085 },
          weather: [{ id: 800, main: 'Clear', description: 'clear sky', icon: '01d' }],
          main: { temp: 293.15 },
          name: 'London',
          id: 2643743
        }
      };

      regionRepository.getRegionFromName.mockResolvedValue(mockRegionData);
      OpenWeather.getCurrentWeather.mockResolvedValue(mockWeatherResponse);

      const result = await getCurrentWeatherByRegionName.execute('London', 'GB');

      expect(result).toEqual({
        success: true,
        data: expect.any(Weather)
      });

      expect(regionRepository.getRegionFromName).toHaveBeenCalledWith('London', 'GB');
      expect(OpenWeather.getCurrentWeather).toHaveBeenCalledWith(2643743);
    });

    it('should convert country code to uppercase', async () => {
      const mockRegionData = { id: 123, name: 'Paris' };
      const mockWeatherResponse = { data: { name: 'Paris' } };

      regionRepository.getRegionFromName.mockResolvedValue(mockRegionData);
      OpenWeather.getCurrentWeather.mockResolvedValue(mockWeatherResponse);

      await getCurrentWeatherByRegionName.execute('Paris', 'fr');

      expect(regionRepository.getRegionFromName).toHaveBeenCalledWith('Paris', 'FR');
    });

    it('should throw InvalidRegionNameError for invalid region names', async () => {
      const invalidRegions = [
        null,
        undefined,
        '',
        'A', // too short
        123, // not a string
        {}, // not a string
      ];

      for (const invalidRegion of invalidRegions) {
        await expect(getCurrentWeatherByRegionName.execute(invalidRegion, 'GB'))
          .rejects
          .toThrow('InvalidRegionNameError');
      }

      expect(regionRepository.getRegionFromName).not.toHaveBeenCalled();
    });

    it('should throw InvalidCountryCodeError for invalid country codes', async () => {
      const invalidCountryCodes = [
        null,
        undefined,
        '',
        'G', // too short
        'GBR', // too long
        123, // not a string
        {}, // not a string
      ];

      for (const invalidCode of invalidCountryCodes) {
        await expect(getCurrentWeatherByRegionName.execute('London', invalidCode))
          .rejects
          .toThrow('InvalidCountryCodeError');
      }

      expect(regionRepository.getRegionFromName).not.toHaveBeenCalled();
    });

    it('should throw RegionNotFoundError when region is not found in repository', async () => {
      regionRepository.getRegionFromName.mockResolvedValue(null);

      await expect(getCurrentWeatherByRegionName.execute('NonExistentCity', 'XX'))
        .rejects
        .toThrow('RegionNotFoundError');

      expect(regionRepository.getRegionFromName).toHaveBeenCalledWith('NonExistentCity', 'XX');
      expect(OpenWeather.getCurrentWeather).not.toHaveBeenCalled();
    });

    it('should throw WeatherDataNotFoundError when weather service returns null', async () => {
      const mockRegionData = { id: 123, name: 'TestCity' };

      regionRepository.getRegionFromName.mockResolvedValue(mockRegionData);
      OpenWeather.getCurrentWeather.mockResolvedValue(null);

      await expect(getCurrentWeatherByRegionName.execute('TestCity', 'US'))
        .rejects
        .toThrow('WeatherDataNotFoundError');

      expect(OpenWeather.getCurrentWeather).toHaveBeenCalledWith(123);
    });

    it('should throw WeatherDataNotFoundError when weather response has no data', async () => {
      const mockRegionData = { id: 123, name: 'TestCity' };

      regionRepository.getRegionFromName.mockResolvedValue(mockRegionData);
      OpenWeather.getCurrentWeather.mockResolvedValue({});

      await expect(getCurrentWeatherByRegionName.execute('TestCity', 'US'))
        .rejects
        .toThrow('WeatherDataNotFoundError');
    });

    it('should propagate repository errors', async () => {
      const repositoryError = new Error('Database connection failed');
      regionRepository.getRegionFromName.mockRejectedValue(repositoryError);

      await expect(getCurrentWeatherByRegionName.execute('London', 'GB'))
        .rejects
        .toThrow('Database connection failed');

      expect(OpenWeather.getCurrentWeather).not.toHaveBeenCalled();
    });

    it('should propagate weather service errors', async () => {
      const mockRegionData = { id: 123, name: 'TestCity' };
      const weatherError = new Error('Weather API error');

      regionRepository.getRegionFromName.mockResolvedValue(mockRegionData);
      OpenWeather.getCurrentWeather.mockRejectedValue(weatherError);

      await expect(getCurrentWeatherByRegionName.execute('TestCity', 'US'))
        .rejects
        .toThrow('Weather API error');
    });

    it('should handle region names with minimum valid length', async () => {
      const mockRegionData = { id: 123, name: 'NY' };
      const mockWeatherResponse = { data: { name: 'NY' } };

      regionRepository.getRegionFromName.mockResolvedValue(mockRegionData);
      OpenWeather.getCurrentWeather.mockResolvedValue(mockWeatherResponse);

      const result = await getCurrentWeatherByRegionName.execute('NY', 'US');

      expect(result.success).toBe(true);
      expect(regionRepository.getRegionFromName).toHaveBeenCalledWith('NY', 'US');
    });

    it('should handle regions with special characters in names', async () => {
      const regionName = "São Paulo";
      const mockRegionData = { id: 456, name: regionName };
      const mockWeatherResponse = { data: { name: regionName } };

      regionRepository.getRegionFromName.mockResolvedValue(mockRegionData);
      OpenWeather.getCurrentWeather.mockResolvedValue(mockWeatherResponse);

      const result = await getCurrentWeatherByRegionName.execute(regionName, 'BR');

      expect(result.success).toBe(true);
      expect(regionRepository.getRegionFromName).toHaveBeenCalledWith(regionName, 'BR');
    });
  });
});
