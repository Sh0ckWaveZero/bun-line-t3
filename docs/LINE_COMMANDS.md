# LINE Bot Commands Reference

## Attendance System Commands

### 1️⃣ Check-in Commands
- `/work` - Open check-in menu
- `/งาน` - Open check-in menu
- `/เข้างาน` - Open check-in menu
- `/checkin` - Open check-in menu

### 2️⃣ Check-out Commands
- `/เลิกงาน` - Check out immediately
- `/ออกงาน` - Check out immediately
- `/checkout` - Check out immediately

### 3️⃣ Status Commands
- `/สถานะ` - Check current work status
- `/status` - Check current work status

### 4️⃣ Report Commands
- `/รายงาน` - View attendance reports
- `/report` - View attendance reports

### 5️⃣ Policy Commands
- `/นโยบาย` - View workplace policies
- `/policy` - View workplace policies
- `/กฎ` - View workplace policies
- `/rule` - View workplace policies

## Cryptocurrency & Information Commands

### 🪙 Cryptocurrency - Bitkub
- `/bk [symbol]` - Get crypto price from Bitkub (e.g., `/bk btc`)
- `/bitkub [symbol]` - Get crypto price from Bitkub (e.g., `/bitkub eth`)

### 🪙 Cryptocurrency - Satang Pro
- `/st [symbol]` - Get crypto price from Satang Pro (e.g., `/st btc`)
- `/satang [symbol]` - Get crypto price from Satang Pro (e.g., `/satang eth`)

### 🪙 Cryptocurrency - Bitazza
- `/btz [symbol]` - Get crypto price from Bitazza (e.g., `/btz btc`)
- `/bitazza [symbol]` - Get crypto price from Bitazza (e.g., `/bitazza eth`)

### 🌐 Cryptocurrency - Binance
- `/bn [symbol]` - Get crypto price from Binance paired with USDT (e.g., `/bn btc`)
- `/binance [symbol]` - Get crypto price from Binance paired with USDT (e.g., `/binance eth`)
- `/bnbusd [symbol]` - Get crypto price from Binance paired with BUSD (e.g., `/bnbusd btc`)

### 🌐 Cryptocurrency - Gate.io
- `/gate [symbol]` - Get crypto price from Gate.io (e.g., `/gate btc`)
- `/gateio [symbol]` - Get crypto price from Gate.io (e.g., `/gateio eth`)
- `/gt [symbol]` - Get crypto price from Gate.io (e.g., `/gt btc`)

### 🌐 Cryptocurrency - MEXC
- `/mexc [symbol]` - Get crypto price from MEXC (e.g., `/mexc btc`)
- `/mx [symbol]` - Get crypto price from MEXC (e.g., `/mx eth`)

### 📊 Cryptocurrency - CoinMarketCap
- `/cmc [symbol]` - Get price and info from CoinMarketCap (e.g., `/cmc btc`)
- `/coinmarketcap [symbol]` - Get price and info from CoinMarketCap (e.g., `/coinmarketcap eth`)

### 💰 Gold Price
- `/gold` - Get latest gold prices
- `/ทอง` - Get latest gold prices

### 🎯 Lottery Results
- `/หวย [date]` - Check lottery results (e.g., `/หวย 16/04/2566`)
- `/lotto [date]` - Check lottery results (e.g., `/lotto 16/04/2566`)

### ⛽ Fuel Prices
- `/gas [type]` - Get latest fuel prices (e.g., `/gas diesel`)
- `/น้ำมัน [type]` - Get latest fuel prices (e.g., `/น้ำมัน เบนซิน`)

### ℹ️ Help & Documentation
- `/help` - View all available commands and usage instructions
- `/ช่วยเหลือ` - View all available commands and usage instructions
- `/คำสั่ง` - View all available commands and usage instructions
- `/commands` - View all available commands and usage instructions

## Notes
- All commands must start with `/`
- You can use Thai or English commands as needed
- Some commands require additional parameters, such as `/bk btc` to view Bitcoin price on Bitkub

## Technical Appendix: Webhook Examples

For developers integrating with the LINE Bot API, here are example webhook payloads for different interactions.

### Text Message Payloads

#### Check-in Command Example
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

#### Check-out Command Example
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

### Postback Payloads

#### Check-in Button Example
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

#### Check-out Button Example
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

### Testing with curl

#### Send Check-in Command
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

#### Send Check-in Postback
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
