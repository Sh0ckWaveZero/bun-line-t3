# Air Quality Monitoring

The LINE bot includes an air quality monitoring system that provides real-time Air Quality Index (AQI) data based on user location.

## Features

- **Location-Based AQI Data**: Get air quality information for your current location
- **Health Recommendations**: Receive personalized health advice based on current AQI
- **Visual Indicators**: Color-coded AQI levels for easy understanding
- **Detailed Pollutants**: Breakdown of PM2.5, PM10, and other air quality parameters

## How to Use

### Sharing Your Location

1. Tap the "+" button in LINE chat
2. Select "Location"
3. Share your current location or select a location on the map
4. The bot will respond with the nearest air quality station's data

### Interpreting the Data

The response includes:

- **AQI Value**: Current Air Quality Index number
- **AQI Level**: Qualitative assessment (Good, Moderate, Unhealthy, etc.)
- **Health Recommendations**: Actions to take based on the current conditions
- **PM2.5 and PM10 Levels**: Specific pollutant measurements
- **City and Station**: The monitoring location providing the data

## AQI Categories

| AQI Level | Range | Color | Health Implications |
|-----------|-------|-------|---------------------|
| Good | 0-50 | Green | Air quality is considered satisfactory, and air pollution poses little or no risk. |
| Moderate | 51-100 | Yellow | Air quality is acceptable; however, there may be some concern for a very small number of people who are unusually sensitive to air pollution. |
| Unhealthy for Sensitive Groups | 101-150 | Orange | Members of sensitive groups may experience health effects. The general public is not likely to be affected. |
| Unhealthy | 151-200 | Red | Everyone may begin to experience health effects; members of sensitive groups may experience more serious health effects. |
| Very Unhealthy | 201-300 | Purple | Health warnings of emergency conditions. The entire population is more likely to be affected. |
| Hazardous | 301+ | Maroon | Health alert: everyone may experience more serious health effects. |

## Technical Implementation

The air quality data is sourced from the IQAir AirVisual API, which provides:

- Real-time AQI data
- Nearest station calculation
- Historical trends
- Weather conditions related to air quality

For developers, the implementation can be found in:
- [`airvisual.ts`](../src/features/air-quality/services/airvisual.ts)
- [`air-visual.ts`](../src/features/air-quality/types/air-visual.ts)

## Best Practices

- **Check at Different Times**: Air quality can vary throughout the day
- **Compare Multiple Locations**: If you travel between areas, compare readings
- **Check Before Outdoor Activities**: Especially important for exercise or children's activities
- **Follow Recommendations**: Take suggested actions seriously during high AQI events

## Privacy Note

Location data is used only for retrieving the nearest air quality station data and is not stored permanently.
