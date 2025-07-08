import Weather from '../../../src/domain/entities/Weather.js';
import GetCurrentWeatherForRegion from '../../../src/domain/usecases/GetCurrentWeatherForRegion.js';
import { OpenWeather } from '../../../src/interfaces/services/open-weather/OpenWeather.js';

// Mock the database connection to prevent hanging processes
jest.mock('../../../db/mongoose.js', () => ({
  connectWithResilience: jest.fn().mockResolvedValue(true),
  mongoose: {
    connection: {
      readyState: 0,
      close: jest.fn().mockResolvedValue(true)
    }
  }
}));

// Mock the OpenWeather service
jest.mock('../../../src/interfaces/services/open-weather/OpenWeather.js', () => ({
  OpenWeather: {
    getCurrentWeather: jest.fn()
  }
}));

describe('GetCurrentWeatherForRegion', () => {
  let weatherRepository;
  let getCurrentWeatherForRegion;

  beforeEach(() => {
    weatherRepository = {};
    getCurrentWeatherForRegion = new GetCurrentWeatherForRegion(weatherRepository);
    jest.clearAllMocks();
  });

  afterAll(async () => {
    // Clean up Jest timers
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe('execute()', () => {
    it('should return weather data for a valid region ID', async () => {
      // Mock successful API response
      const mockWeatherData = {
        data: {
          coord: { lon: 2.159, lat: 41.3888 },
          weather: [{ id: 800, main: 'Clear', description: 'clear sky', icon: '01d' }],
          base: 'stations',
          main: {
            temp: 300.03,
            feels_like: 300.76,
            temp_min: 300.03,
            temp_max: 300.03,
            pressure: 1017,
            humidity: 55,
            sea_level: 1017,
            grnd_level: 1009
          },
          visibility: 10000,
          wind: { speed: 3, deg: 242, gust: 3.9 },
          clouds: { all: 0 },
          dt: 1750748969,
          sys: { country: 'ES', sunrise: 1750738727, sunset: 1750793322 },
          timezone: 7200,
          id: 3128760,
          name: 'Barcelona',
          cod: 200
        }
      };

      OpenWeather.getCurrentWeather.mockResolvedValue(mockWeatherData);

      const result = await getCurrentWeatherForRegion.execute(3128760);

      // Verify OpenWeather was called with correct region ID
      expect(OpenWeather.getCurrentWeather).toHaveBeenCalledWith(3128760);

      // Verify response structure
      expect(result).toEqual({
        success: true,
        data: expect.any(Weather)
      });

      // Verify Weather entity was properly created
      expect(result.data.cityName).toBe('Barcelona');
      expect(result.data.system.country).toBe('ES');
    });

    it('should throw WeatherDataNotFoundError when no data is returned', async () => {
      // Mock empty response
      OpenWeather.getCurrentWeather.mockResolvedValue(null);

      await expect(getCurrentWeatherForRegion.execute(3128760))
        .rejects
        .toThrow('WeatherDataNotFoundError');
    });

    it('should throw WeatherDataNotFoundError when data property is missing', async () => {
      // Mock response missing data property
      OpenWeather.getCurrentWeather.mockResolvedValue({});

      await expect(getCurrentWeatherForRegion.execute(3128760))
        .rejects
        .toThrow('WeatherDataNotFoundError');
    });

    it('should propagate any errors from the OpenWeather service', async () => {
      // Mock API error
      const mockError = new Error('API Error');
      OpenWeather.getCurrentWeather.mockRejectedValue(mockError);

      await expect(getCurrentWeatherForRegion.execute(3128760))
        .rejects
        .toThrow(mockError);
    });

    it('should handle invalid weather data format gracefully', async () => {
      // Mock malformed data
      OpenWeather.getCurrentWeather.mockResolvedValue({
        data: {
          // Missing required fields
          name: 'Barcelona'
        }
      });

      const result = await getCurrentWeatherForRegion.execute(3128760);

      // Should still return a Weather object but with undefined fields
      expect(result).toEqual({
        success: true,
        data: expect.any(Weather)
      });
      expect(result.data.cityName).toBe('Barcelona');
    });
  });
});
