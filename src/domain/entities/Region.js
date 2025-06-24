export default class Region {
  constructor(id, name, country, population, coordinates) {
    this.id = id;
    this.name = name;
    this.country = country;
    this.population = population;
    this.coordinates = coordinates;
  }

  static fromJson(json) {
    return new Region(
      json.id,
      json.name,
      json.country,
      json.population,
      json.coordinates
    );
  }

  toJson() {
    return {
      id: this.id,
      name: this.name,
      country: this.country,
      population: this.population,
      coordinates: this.coordinates
    };
  }

  get longitude() {
    return this.coordinates.lon;
  }

  get latitude() {
    return this.coordinates.lat;
  }

  toString() {
    return `${this.name}, ${this.country} (Pop: ${this.population.toLocaleString()}) [${this.latitude.toFixed(4)}, ${this.longitude.toFixed(4)}]`;
  }
}
