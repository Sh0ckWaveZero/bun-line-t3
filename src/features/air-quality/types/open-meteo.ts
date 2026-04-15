export interface OpenMeteoAirQualityResponse {
  latitude: number;
  longitude: number;
  current: {
    time: string;
    interval: number;
    pm2_5: number;
    us_aqi: number;
  };
}

export interface OpenMeteoWeatherResponse {
  latitude: number;
  longitude: number;
  current: {
    time: string;
    interval: number;
    temperature_2m: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
  };
}
