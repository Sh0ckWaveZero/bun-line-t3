# Example LINE Webhook Payloads for Attendance System

## 1. Text Message - Check-in Command
```json
{
  "events": [
    {
      "type": "message",
      "message": {
        "type": "text",
        "text": "/work"
      },
      "source": {
        "userId": "U1234567890abcdef"
      },
      "replyToken": "replytoken123"
    }
  ]
}
```

## 2. Text Message - Check-out Command
```json
{
  "events": [
    {
      "type": "message",
      "message": {
        "type": "text",
        "text": "/checkout"
      },
      "source": {
        "userId": "U1234567890abcdef"
      },
      "replyToken": "replytoken123"
    }
  ]
}
```

## 3. Text Message - Status Command
```json
{
  "events": [
    {
      "type": "message",
      "message": {
        "type": "text",
        "text": "/status"
      },
      "source": {
        "userId": "U1234567890abcdef"
      },
      "replyToken": "replytoken123"
    }
  ]
}
```

## 4. Postback - Check-in Button
```json
{
  "events": [
    {
      "type": "postback",
      "postback": {
        "data": "action=checkin"
      },
      "source": {
        "userId": "U1234567890abcdef"
      },
      "replyToken": "replytoken123"
    }
  ]
}
```

## 5. Postback - Check-out Button
```json
{
  "events": [
    {
      "type": "postback",
      "postback": {
        "data": "action=checkout"
      },
      "source": {
        "userId": "U1234567890abcdef"
      },
      "replyToken": "replytoken123"
    }
  ]
}
```

## 6. Postback - Status Button
```json
{
  "events": [
    {
      "type": "postback",
      "postback": {
        "data": "action=status"
      },
      "source": {
        "userId": "U1234567890abcdef"
      },
      "replyToken": "replytoken123"
    }
  ]
}
```

## Testing with curl

### Send Check-in Command
```bash
curl -X POST http://localhost:3000/api/line \
  -H "Content-Type: application/json" \
  -d '{
    "events": [
      {
        "type": "message",
        "message": {
          "type": "text",
          "text": "/work"
        },
        "source": {
          "userId": "U1234567890abcdef"
        },
        "replyToken": "replytoken123"
      }
    ]
  }'
```

### Send Check-in Postback
```bash
curl -X POST http://localhost:3000/api/line \
  -H "Content-Type: application/json" \
  -d '{
    "events": [
      {
        "type": "postback",
        "postback": {
          "data": "action=checkin"
        },
        "source": {
          "userId": "U1234567890abcdef"
        },
        "replyToken": "replytoken123"
      }
    ]
  }'
```

### Send Push Message
```bash
curl -X POST http://localhost:3000/api/attendance-push \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "U1234567890abcdef",
    "messageType": "checkin_menu"
  }'
```
