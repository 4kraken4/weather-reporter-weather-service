/**
 * Utility class for handling city name normalization, validation, and cache key generation
 * Handles complex city names with special characters, Unicode, and various formats
 */
export default class CityNameUtils {
  /**
   * Normalize a city name for consistent processing
   * @param {string} cityName - The city name to normalize
   * @returns {string} - Normalized city name
   */
  static normalizeCityName(cityName) {
    if (!cityName || typeof cityName !== 'string') {
      return '';
    }

    return (
      cityName
        .trim()
        // Normalize Unicode characters (NFD - Canonical Decomposition)
        .normalize('NFD')
        // Remove diacritical marks but keep base characters
        .replace(/[\u0300-\u036f]/g, '')
        // Convert to lowercase for consistency
        .toLowerCase()
        // Replace multiple spaces with single space
        .replace(/\s+/g, ' ')
        // Remove leading/trailing special characters
        .replace(/^[^\w\s]+|[^\w\s]+$/g, '')
        // Trim again after normalization
        .trim()
    );
  }

  /**
   * Generate a cache-safe key from city and country names
   * @param {string} city - The city name
   * @param {string} country - The country code or name (optional)
   * @returns {string} - Safe cache key
   */
  static generateCacheKey(city, country = '') {
    const normalizedCity = this.normalizeCityName(city);
    const normalizedCountry = this.normalizeCityName(country);

    // Create a safe key by replacing problematic characters
    const safeCityKey = normalizedCity
      .replace(/[^a-z0-9\s-]/g, '') // Keep only alphanumeric, spaces, and hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens

    const safeCountryKey = normalizedCountry
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    return safeCountryKey ? `${safeCityKey}-${safeCountryKey}` : safeCityKey;
  }

  /**
   * Validate if a city name is acceptable for API requests
   * More flexible validation for international city names
   * @param {string} cityName - The city name to validate
   * @returns {boolean} - True if valid, false otherwise
   */
  static isValidCityName(cityName) {
    if (!cityName || typeof cityName !== 'string') {
      return false;
    }

    const trimmed = cityName.trim();

    // Basic length check
    if (trimmed.length < 1 || trimmed.length > 100) {
      return false;
    }

    // Check for obviously invalid patterns
    if (
      // Must contain at least one letter (expanded Unicode support)
      !/[a-zA-Z\u00C0-\u024F\u1E00-\u1EFF\u0400-\u04FF\u4E00-\u9FFF\u0590-\u05FF\u0600-\u06FF\u0750-\u077F]/.test(
        trimmed
      ) ||
      // No excessive punctuation
      /[.]{3,}|[,]{2,}|[;]{2,}/.test(trimmed) ||
      // No excessive spaces
      /\s{3,}/.test(trimmed) ||
      // No starting/ending with special chars (except parentheses for districts)
      /^[^\w\u00C0-\u024F\u1E00-\u1EFF\u0400-\u04FF\u4E00-\u9FFF\u0590-\u05FF\u0600-\u06FF\u0750-\u077F(]|[^\w\u00C0-\u024F\u1E00-\u1EFF\u0400-\u04FF\u4E00-\u9FFF\u0590-\u05FF\u0600-\u06FF\u0750-\u077F)]$/.test(
        trimmed
      )
    ) {
      return false;
    }

    return true;
  }

  /**
   * Clean city name for API requests while preserving important information
   * @param {string} cityName - The city name to clean
   * @returns {string} - Cleaned city name suitable for API calls
   */
  static cleanForApiRequest(cityName) {
    if (!cityName || typeof cityName !== 'string') {
      return '';
    }

    return (
      cityName
        .trim()
        // Remove excessive whitespace
        .replace(/\s+/g, ' ')
        // Normalize common punctuation
        .replace(/["""]/g, '"')
        .replace(/[\u2018\u2019\u2032\u0027]/g, "'")
        .replace(/[–—]/g, '-')
        // Trim again
        .trim()
    );
  }

  /**
   * Extract main city name from complex names with districts/areas
   * E.g., "Zürich (Kreis 11) / Oerlikon" -> "Zürich"
   * @param {string} cityName - The complex city name
   * @returns {string} - Main city name
   */
  static extractMainCityName(cityName) {
    if (!cityName || typeof cityName !== 'string') {
      return '';
    }

    let mainName = cityName.trim();

    // Remove content in parentheses (districts, areas)
    mainName = mainName.replace(/\([^)]*\)/g, '').trim();

    // Split by common separators and take the first meaningful part
    const separators = ['/', '\\', '-', '–', '—'];
    for (const separator of separators) {
      if (mainName.includes(separator)) {
        const parts = mainName.split(separator);
        const firstPart = parts[0].trim();
        if (firstPart.length > 2) {
          // Ensure it's not just an abbreviation
          mainName = firstPart;
          break;
        }
      }
    }

    return mainName.trim();
  }

  /**
   * Create fallback city names for API requests
   * Returns an array of possible city name variations to try
   * @param {string} cityName - The original city name
   * @returns {Array<string>} - Array of city name variations
   */
  static createFallbackNames(cityName) {
    if (!cityName || typeof cityName !== 'string') {
      return [];
    }

    const variations = new Set();
    const original = cityName.trim();

    // Add original name
    variations.add(original);

    // Add cleaned version
    const cleaned = this.cleanForApiRequest(original);
    if (cleaned && cleaned !== original) {
      variations.add(cleaned);
    }

    // Add main city name (without districts)
    const mainName = this.extractMainCityName(original);
    if (mainName && mainName !== original && mainName !== cleaned) {
      variations.add(mainName);
    }

    // Add normalized version
    const normalized = this.normalizeCityName(original);
    if (normalized && normalized !== original.toLowerCase()) {
      variations.add(normalized);
    }

    return Array.from(variations).filter(name => name.length > 0);
  }
}
