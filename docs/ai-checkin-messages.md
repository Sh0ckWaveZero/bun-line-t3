# AI-Powered Check-in Messages

## Overview

The check-in reminder system now supports AI-generated messages using the AI SDK with OpenAI models, while maintaining backward compatibility with static messages.

## Features

### 🤖 AI-Generated Messages

- Dynamic, context-aware messages in Thai
- Personalized based on user name, time of day, weather, and day of week
- Uses OpenAI GPT-5.6 Luna model

### 🔄 Fallback System

- Automatically falls back to static messages if:
  - No OpenAI API key is provided
  - API quota exceeded
  - Network errors occur
  - Any other AI generation errors

### 📱 Seamless Integration

- Works with existing cron reminder system
- No breaking changes to current functionality
- Automatic context detection (time of day, day of week)

## Usage

### Basic Usage

```typescript
import { getCheckInMessage } from "@/lib/constants/checkin-reminder-messages";

// Get AI message (if available) or fallback
const message = await getCheckInMessage({
  useAI: true,
  userName: "สมชาย",
  context: {
    timeOfDay: "morning",
    weather: "แดดใส",
    dayOfWeek: "วันจันทร์",
  },
});
```

### Static Messages Only

```typescript
// Force static messages
const staticMessage = await getCheckInMessage({ useAI: false });
```

### Direct AI Generation

```typescript
import { generateCheckInMessage } from "@/lib/constants/checkin-reminder-messages";

const aiMessage = await generateCheckInMessage({
  userName: "นางสาวใจดี",
  timeOfDay: "morning",
  weather: "ฝนตก",
  dayOfWeek: "วันศุกร์",
});
```

## Configuration

### Environment Variables

Add your OpenAI API key to `.env`:

```
OPENAI_API_KEY=your_api_key_here
```

### Automatic Behavior

- **With API key**: Uses AI generation with fallback to static messages
- **Without API key**: Uses static messages only
- **API errors**: Automatically falls back to static messages

## Integration with Cron System

The cron reminder sender (`src/lib/utils/cron-reminder-sender.ts`) automatically:

1. Detects current time of day
2. Gets current day of week in Thai
3. Attempts AI generation if API key is available
4. Falls back to static messages on any error
5. Logs the message type used

## Error Handling

All AI errors are:

- Caught and logged for debugging
- Gracefully handled with fallback messages
- Transparent to end users
- Non-breaking to the application flow

## Static Messages

8 high-quality Thai check-in messages are available as fallbacks:

- Morning greetings with emojis
- Encouraging and friendly tone
- Consistent with company culture
- Tested and proven effective
