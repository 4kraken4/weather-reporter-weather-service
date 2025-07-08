export default class Weather {
  constructor({
    coord,
    weather,
    base,
    main,
    visibility,
    wind,
    rain,
    snow,
    clouds,
    dt,
    sys,
    timezone,
    id,
    name,
    cod
  }) {
    this.coordinates = coord;
    this.conditions = weather;
    this.dataSource = base;
    this.metrics = main;
    this.visibility = visibility;
    this.wind = wind;
    this.rain = rain;
    this.snow = snow;
    this.clouds = clouds;
    this.timestamp = dt;
    this.system = sys;
    this.timezone = timezone;
    this.cityId = id;
    this.cityName = name;
    this.responseCode = cod;
  }

  static fromJson(json) {
    return new Weather(json);
  }

  get primaryCondition() {
    return this.conditions[0];
  }

  get tempCelsius() {
    // Temperature is already in Celsius when using metric units
    return this.metrics.temp;
  }

  get tempFahrenheit() {
    return (this.tempCelsius * 9) / 5 + 32;
  }

  get localTime() {
    const date = new Date((this.timestamp + this.timezone) * 1000);
    return date.toLocaleString();
  }

  get sunriseTime() {
    const date = new Date(this.system.sunrise * 1000);
    return date.toLocaleTimeString();
  }

  get sunsetTime() {
    const date = new Date(this.system.sunset * 1000);
    return date.toLocaleTimeString();
  }

  toJson() {
    return {
      coord: this.coordinates,
      weather: this.conditions,
      base: this.dataSource,
      main: this.metrics,
      visibility: this.visibility,
      wind: this.wind,
      rain: this.rain,
      snow: this.snow,
      clouds: this.clouds,
      dt: this.timestamp,
      sys: this.system,
      timezone: this.timezone,
      id: this.cityId,
      name: this.cityName,
      cod: this.responseCode
    };
  }

  toString() {
    const condition = this.primaryCondition;
    return `${this.cityName}, ${this.system.country}: ${condition.main} (${condition.description}) - ${this.tempCelsius.toFixed(1)}°C`;
  }
}
