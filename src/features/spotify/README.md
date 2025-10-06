# 🎵 Spotify Integration

Spotify music recommendation feature via LINE Bot using `/ai spotify` command.

## Features

- 🎭 **Mood-based recommendations** - Get music based on your current mood
- 🔍 **Smart search** - Find similar songs based on artist or track name
- 🎨 **Beautiful Flex Messages** - Interactive cards with album art and play buttons
- 🇹🇭 **Thai market support** - Optimized for Thai Spotify users

## Setup

### 1. Get Spotify API Credentials

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app (or use existing one)
3. Copy your **Client ID** and **Client Secret**

### 2. Configure Environment Variables

Add to your `.env.development` or `.env.production`:

```bash
SPOTIFY_CLIENT_ID=your_spotify_client_id_here
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here
```

### 3. Test the Integration

```bash
bun run dev
```

Send a message in LINE:
```
/ai spotify
```

## Usage

### Show Mood Selection Menu
```
/ai spotify
```

### Get Recommendations by Mood
```
/ai spotify happy        # 😊 Happy music
/ai spotify sad          # 😢 Sad music
/ai spotify energetic    # ⚡ Energetic music
/ai spotify chill        # 😌 Chill music
/ai spotify party        # 🎉 Party music
/ai spotify focus        # 🎯 Focus music
```

### Search and Get Recommendations
```
/ai spotify คิมแฮนึล      # Search for "คิมแฮนึล" and get similar songs
/ai spotify Bruno Mars   # Search for "Bruno Mars" and get similar songs
/ai spotify jazz         # Search for "jazz" and get recommendations
```

### Thai Language Support
```
/ai เพลง happy
/ai เพลง คิมแฮนึล
```

## Architecture

```
src/features/spotify/
├── services/
│   └── spotify.service.ts       # Spotify Web API integration
├── handlers/
│   └── spotify.handler.ts       # Command processing logic
├── templates/
│   └── spotify-flex.template.ts # LINE Flex Message templates
└── README.md                    # This file
```

### Service Layer (`spotify.service.ts`)

Handles all Spotify Web API interactions:

- **Authentication**: Client Credentials Flow with token caching
- **Search**: Find tracks, artists, and playlists
- **Recommendations**: Get personalized music recommendations
- **Mood Mapping**: Convert moods to audio features (energy, valence, danceability)

### Handler Layer (`spotify.handler.ts`)

Processes user commands and coordinates responses:

- Parse user input (mood selection, search queries)
- Call appropriate service methods
- Generate response messages
- Error handling and user feedback

### Template Layer (`spotify-flex.template.ts`)

Creates beautiful LINE Flex Messages:

- **Carousel**: Display multiple tracks with swipe navigation
- **Track Cards**: Show album art, artist, duration, popularity
- **Play Buttons**: Direct links to Spotify
- **Mood Selection**: Interactive button menu

## API Reference

### SpotifyService Methods

#### `getRecommendations(params)`
Get music recommendations based on seeds and audio features.

```typescript
const tracks = await spotifyService.getRecommendations({
  seedGenres: ['pop', 'rock'],
  seedArtists: ['artist_id'],
  seedTracks: ['track_id'],
  targetEnergy: 0.8,
  targetValence: 0.7,
  limit: 10
});
```

#### `getRecommendationsByMood(mood, limit)`
Get recommendations based on predefined mood configurations.

```typescript
const tracks = await spotifyService.getRecommendationsByMood('happy', 10);
```

Available moods:
- `happy` - High valence, high energy
- `sad` - Low valence, low energy
- `energetic` - Very high energy, high danceability
- `chill` - Low energy, medium valence
- `party` - Very high energy, very high danceability
- `focus` - Low energy, medium valence

#### `search(query, type, limit)`
Search for tracks, artists, or playlists.

```typescript
const results = await spotifyService.search('Bruno Mars', 'track', 10);
```

### Flex Message Templates

#### `createSpotifyRecommendationsCarousel(tracks, title)`
Creates a carousel of track cards (up to 10 tracks).

#### `createSpotifyTrackMessage(track, title)`
Creates a single track card.

#### `createMoodSelectionMessage()`
Creates an interactive mood selection menu.

#### `createSpotifyErrorMessage(errorMessage)`
Creates an error message bubble.

## Audio Features Mapping

Moods are mapped to Spotify's audio features:

| Mood | Energy | Valence | Danceability | Genres |
|------|--------|---------|--------------|--------|
| Happy | 0.7 | 0.8 | - | pop, happy |
| Sad | 0.4 | 0.3 | - | sad, acoustic |
| Energetic | 0.9 | - | 0.8 | edm, dance, electronic |
| Chill | 0.3 | 0.6 | - | chill, ambient, lo-fi |
| Party | 0.9 | - | 0.9 | party, dance, pop |
| Focus | 0.4 | 0.5 | - | study, instrumental, classical |

## Error Handling

All errors are caught and displayed to users with helpful messages:

- **Authentication Errors**: "Unable to authenticate with Spotify"
- **Search Errors**: "No results found for [query]"
- **API Errors**: Shows specific error message
- **Configuration Errors**: "Spotify credentials not configured"

## Performance Optimization

- **Token Caching**: Access tokens cached until 1 minute before expiry
- **Batch Processing**: Up to 10 tracks in carousel
- **Image Optimization**: Uses medium-size album images (300x300)
- **Market Filtering**: Results filtered for Thai market (TH)

## Testing

Run tests for Spotify integration:

```bash
bun test spotify
```

## Troubleshooting

### "Spotify credentials not configured"
- Check `.env` file has `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET`
- Restart the development server

### "No recommendations found"
- Try a different mood or search query
- Check Spotify API status

### "Unable to authenticate with Spotify"
- Verify your Client ID and Secret are correct
- Check if your Spotify app has required permissions

## Future Enhancements

- [ ] User playlist creation
- [ ] Save favorite tracks
- [ ] Share playlists with friends
- [ ] Audio preview in LINE
- [ ] More mood options
- [ ] Genre exploration
- [ ] Top tracks by country
- [ ] Podcast recommendations

## References

- [Spotify Web API Documentation](https://developer.spotify.com/documentation/web-api)
- [LINE Flex Message Simulator](https://developers.line.biz/flex-simulator/)
- [Audio Features Reference](https://developer.spotify.com/documentation/web-api/reference/get-audio-features)
