# Cryptocurrency Price Tracking

The LINE bot includes powerful cryptocurrency price tracking functionality, allowing users to check real-time prices from multiple exchanges.

## Supported Exchanges

The system connects to multiple cryptocurrency exchanges to provide comprehensive price data:

| Exchange | Commands | Markets | Data Points |
|----------|----------|---------|------------|
| Bitkub | `/bk`, `/bitkub` | THB | Price, 24h Change, 24h Volume |  
| Satang Pro | `/st`, `/satang` | THB | Price, 24h Change, 24h Volume |
| Bitazza | `/btz`, `/bitazza` | THB | Price, 24h Change, 24h Volume |
| Binance | `/bn`, `/binance` | USDT | Price, 24h Change, 24h Volume |
| Binance | `/bnbusd` | BUSD | Price, 24h Change, 24h Volume |
| Gate.io | `/gate`, `/gateio`, `/gt` | USDT | Price, 24h Change, 24h Volume |
| MEXC | `/mexc`, `/mx` | USDT | Price, 24h Change, 24h Volume |
| CoinMarketCap | `/cmc`, `/coinmarketcap` | USD | Price, Market Cap, 24h Change, Rank |

## Usage Examples

### Basic Price Check

To check the price of a cryptocurrency, use the exchange command followed by the symbol:

```
/bk btc
```

This will return the current price of Bitcoin on Bitkub in THB, along with 24-hour change and trading volume.

### Multiple Currencies

You can check multiple currencies with a single command:

```
/bn btc eth sol
```

This will return the prices of Bitcoin, Ethereum, and Solana on Binance in USDT.

### Response Format

For exchange-specific commands, the response appears as a rich Flex Message with:

- Current price
- 24-hour price change (with color indicator)
- 24-hour trading volume
- Last updated timestamp

## Command Reference

### Thai Exchanges (THB pairs)

```
/bk [symbol]    - Bitkub price in THB
/st [symbol]    - Satang Pro price in THB  
/btz [symbol]   - Bitazza price in THB
```

### International Exchanges (USDT/BUSD pairs)

```
/bn [symbol]    - Binance price in USDT
/bnbusd [symbol] - Binance price in BUSD
/gate [symbol]  - Gate.io price in USDT
/mexc [symbol]  - MEXC price in USDT
```

### Market Data

```
/cmc [symbol]   - CoinMarketCap price and market data in USD
```

## Implementation Notes

- All requests are proxied through the server to avoid CORS and API key issues
- Price data is cached briefly to minimize API calls
- Error handling includes graceful fallbacks when exchanges are unavailable

For full technical implementation details, see [`crypto.ts`](../src/features/crypto/services/exchange.ts).
