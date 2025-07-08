export default class Region {
  constructor(id, name, state, countryCode, coordinates) {
    this.id = id;
    this.name = name;
    this.state = state;
    this.countryCode = countryCode;
    this.coordinates = coordinates;
  }

  static fromJson(json) {
    return new Region(
      json.id,
      json.name,
      json.state,
      json.countryCode,
      json.coordinates
    );
  }

  toJson() {
    return {
      id: this.id,
      name: this.name,
      state: this.state,
      countryCode: this.countryCode,
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
    return `${this.name}, ${this.state}
    [${this.latitude.toFixed(4)}, ${this.longitude.toFixed(4)}], 
    ${this.countryCode ? `(${this.countryCode})` : ''}`;
  }
}
