# AI Command Routing - Natural Language Interface

## Overview

The `/ai` command provides an **intelligent natural language interface** for the LINE bot using **OpenAI GPT-5-nano**. Instead of memorizing specific commands, users can simply describe what they want in Thai or English.

## Architecture

```
LINE User
    ↓ Natural Language: "ดึงราคาทองให้หน่อย"
AI Command Router (OpenAI API)
    ↓ Analyzes Intent & Extracts Parameters
    ↓ command: "gold", confidence: 1.0
Command Executor
    ↓ Executes handleGoldCommand()
Response
    ↓ Gold prices sent to user
```

### Components

1. **Command Registry** (`command-registry.ts`)
   - Centralized catalog of all 20+ LINE commands
   - Includes keywords, parameters, examples for each command
   - Formatted context for AI understanding

2. **OpenAI Client** (`src/lib/ai/openai-client.ts`)
   - `routeCommand()`: Analyzes natural language and returns JSON
   - Direct OpenAI API calls (no MCP overhead)
   - Uses configurable AI model (default: gpt-5-nano from MCP_AI_MODEL env variable)
   - Supports any OpenAI model: gpt-5-nano, gpt-4o, gpt-4-turbo, gpt-3.5-turbo, etc.
   - `chat()`: General AI conversation functionality

3. **AI Command Router** (`ai-command-router.ts`)
   - `executeCommand()`: Routes to appropriate handler
   - Handles all command categories (crypto, work, info, etc.)
   - Returns success/error status with explanations

4. **AI Command Handler** (`handleAiCommand.ts`)
   - Entry point for `/ai` commands
   - Orchestrates routing flow
   - Async processing to avoid LINE webhook timeout (3s limit)

## Usage

### Natural Language Command Routing

```
/ai [your request in Thai or English]
```

### Examples

#### Cryptocurrency Commands

```
/ai ดึงราคาทองให้หน่อย
→ Routes to: /gold

/ai ราคา Bitcoin ตอนนี้เท่าไหร่
→ Routes to: /bitkub with parameter: coin="btc"

/ai show me ethereum price from binance
→ Routes to: /binance with parameter: coin="eth"

/ai สร้างกราฟ BTC จาก binance
→ Routes to: /chart with parameters: exchange="bn", coin="btc"
```

#### Work Attendance Commands

```
/ai เช็คชื่อเข้างาน
→ Routes to: /checkin

/ai check out from work
→ Routes to: /checkout

/ai ดูรายงานการทำงาน
→ Routes to: /report

/ai ดูสถานะงาน
→ Routes to: /status

/ai ขอลาวันที่ 10 มกราคม เหตุผลป่วย
→ Routes to: /leave with parameters: startDate="2025-01-10", reason="ป่วย"
```

#### Information Commands

```
/ai ราคาน้ำมันวันนี้
→ Routes to: /gas

/ai ตรวจหวย
→ Routes to: /lotto

/ai show me workplace policies
→ Routes to: /policy
```

#### Utility Commands

```
/ai สุ่มเลขบัตรประชาชน
→ Routes to: /thai-id

/ai ดูข้อมูลสุขภาพ
→ Routes to: /health

/ai เปิดตั้งค่า
→ Routes to: /settings
```

### Chat Mode (Conversation)

For general conversations that don't route to commands:

```
/ai chat [message]
/ai คุย [ข้อความ]
```

**Examples:**

```
/ai chat สวัสดี มีอะไรให้ช่วยไหม
/ai คุย วันนี้อากาศเป็นอย่างไร
/ai chat explain blockchain to me
```

### Help Command

```
/ai help
/ai ช่วยเหลือ
```

## How It Works

### Step-by-Step Flow

1. **User Input**

   ```
   User: /ai ดึงราคาทองให้หน่อย
   ```

2. **AI Analysis** (via MCP)

   ```json
   {
     "command": "gold",
     "parameters": {},
     "reasoning": "ผู้ใช้ต้องการทราบราคาทอง",
     "confidence": 1.0
   }
   ```

3. **Command Execution**

   ```
   Executes: handleGoldCommand(req)
   ```

4. **Response**
   ```
   Bot: [Gold prices display]
   ```

> **⚠️ LINE Reply Token Limitation**
>
> LINE webhook events provide only **1 reply token** per event. Each message sent consumes this token.
> Therefore, we **do not send loading/confirmation messages** before executing commands.
> The bot processes silently and sends only the final result to preserve the reply token.

### Confidence Levels

The AI returns a confidence score (0.0 - 1.0):

- **≥ 0.8**: High confidence - executes immediately
- **0.6 - 0.8**: Medium confidence - executes with explanation
- **< 0.6**: Low confidence - asks for clarification

Example of low confidence:

```
User: /ai สวัสดี
Bot: ขอโทษครับ ไม่แน่ใจว่าคุณต้องการอะไร

     💭 ที่เข้าใจ: ผู้ใช้ทักทาย ไม่ใช่คำขอคำสั่งใดๆ

     ลองพิมพ์ /ai help เพื่อดูคำสั่งที่มี
```

## Supported Commands

### 📊 Cryptocurrency (6 commands)

- `bitkub`, `binance`, `satang`, `coinmarketcap`: Check crypto prices
- `chart`: Generate price charts

### 💼 Work Attendance (6 commands)

- `checkin`, `checkout`: Record work hours
- `work`, `status`, `report`: View attendance data
- `leave`: Submit leave requests

### ℹ️ Information (4 commands)

- `gold`: Gold prices
- `lotto`: Lottery results
- `gas`: Fuel prices
- `policy`: Workplace policies

### 🏃 Health & Activity (1 command)

- `health`: Health and activity data

### 🔧 Utilities (2 commands)

- `thai-id`: Generate Thai national ID
- `settings`: Configure notifications

### 📚 Meta (1 command)

- `help`: Show all commands

## Configuration

### Environment Variables

```env
# Required - OpenAI API Key
OPENAI_API_KEY=sk-your-openai-api-key

# Optional - AI Model Configuration
# Supports any OpenAI model: gpt-5-nano, gpt-4o, gpt-4-turbo, gpt-3.5-turbo, etc.
# Default: gpt-5-nano (recommended for cost/performance balance)
MCP_AI_MODEL=gpt-5-nano
```

### No Additional Setup Required

The AI command routing uses **direct OpenAI API calls** without any additional server setup:

- ✅ No MCP server needed
- ✅ No external services required
- ✅ Works with existing OPENAI_API_KEY
- ✅ Fast response times (~1-2 seconds)
- ✅ Fire-and-forget pattern to avoid LINE webhook timeout

## Implementation Details

### Command Registry Format

```typescript
{
  command: "gold",
  aliases: ["ทอง"],
  descriptionTH: "ดูราคาทองคำวันนี้",
  descriptionEN: "Check today's gold prices",
  keywords: ["gold", "ทอง", "ราคาทอง", "ทองคำ"],
  examples: ["/gold", "/ทอง", "ราคาทอง"],
  category: "info"
}
```

### AI Routing Prompt

The OpenAI client uses a structured prompt that:

- Provides complete command registry
- Explains parameter extraction
- Shows example mappings
- Requests JSON response format
- Uses temperature 0.3 for consistent routing

### Parameter Extraction

AI automatically extracts parameters from natural language:

```
"ขอลาวันที่ 10 มกราคม เหตุผลป่วย"
→ {
    startDate: "2025-01-10",
    reason: "ป่วย"
  }

"สร้างกราฟ BTC จาก binance"
→ {
    coin: "btc",
    exchange: "bn"
  }
```

## Testing

### Manual Testing via LINE

Simply send messages to your LINE bot:

```bash
# Thai commands
/ai ดึงราคาทองให้หน่อย
/ai ราคา Bitcoin
/ai เช็คชื่อเข้างาน

# English commands
/ai show me gold prices
/ai bitcoin price
/ai check in to work

# Mixed language
/ai ดู Bitcoin price
/ai check ราคาทอง

# Complex commands
/ai สร้างกราฟ BTC จาก binance
/ai ขอลาวันที่ 10 มกราคม

# Chat mode
/ai chat สวัสดีครับ
/ai คุย อากาศวันนี้เป็นอย่างไร
```

### Expected Response Times

- **AI Analysis**: 1-2 seconds (OpenAI API)
- **Command Execution**: 0.5-2 seconds (varies by command)
- **Total**: ~2-4 seconds for complete response
- **LINE Timeout**: Avoided via fire-and-forget pattern

## Error Handling

### Low Confidence

```
Bot: ขอโทษครับ ไม่แน่ใจว่าคุณต้องการอะไร
     💭 ที่เข้าใจ: [reasoning]
     ลองพิมพ์ /ai help เพื่อดูคำสั่งที่มี
```

### Command Not Found

```
Bot: ไม่พบคำสั่งที่เหมาะสม
     💭 [reasoning]
     พิมพ์ /help เพื่อดูคำสั่งทั้งหมด
```

### Execution Error

```
Bot: ❌ เกิดข้อผิดพลาด: [error message]
```

### OpenAI API Error

```
Bot: ขอโทษครับ เกิดข้อผิดพลาดในการประมวลผล
     Error: [sanitized error]
     กรุณาลองใหม่อีกครั้ง
```

Common causes:

- Invalid or expired OPENAI_API_KEY
- OpenAI API rate limits exceeded
- Network connectivity issues

## Performance

- **Average Response Time**: 2-4 seconds (end-to-end)
- **AI Routing**: 1-2 seconds (OpenAI API call)
- **Command Execution**: 0.5-2 seconds (varies by command)
- **Token Usage**: ~300-500 tokens per routing request
- **Webhook Response**: <100ms (fire-and-forget pattern)
- **No Timeout Issues**: Async processing prevents LINE 3s timeout

## Best Practices

### For Users

1. **Be Clear**: State your intent clearly
2. **Include Details**: Mention coin names, dates, etc.
3. **Use Natural Language**: Don't try to mimic commands
4. **Check Confirmation**: Read the AI's understanding before execution

### For Developers

1. **Update Registry**: Add new commands to `command-registry.ts`
2. **Add Examples**: Provide diverse examples in registry
3. **Test Routing**: Add test cases for new commands
4. **Monitor Logs**: Check AI routing decisions
5. **Tune Confidence**: Adjust thresholds based on accuracy

## Future Enhancements

- [ ] Multi-turn conversations for complex requests
- [ ] Context retention across multiple commands
- [ ] User preference learning
- [ ] Command history and suggestions
- [ ] Voice input support
- [ ] Batch command execution
- [ ] Custom command aliases per user
- [ ] Analytics dashboard for routing accuracy

## Troubleshooting

### Issue: AI routes to wrong command

**Solution**:

- Check command keywords in registry
- Add more specific examples
- Review AI reasoning in logs

### Issue: Parameters not extracted correctly

**Solution**:

- Improve parameter descriptions in registry
- Add more example patterns
- Check AI prompt formatting

### Issue: Low confidence for valid requests

**Solution**:

- Add similar examples to registry
- Expand keyword lists
- Review confidence threshold (currently 0.6)

### Issue: LINE webhook timeout

**Solution**:

- ✅ Already fixed with fire-and-forget pattern
- Webhook responds immediately (<100ms)
- AI processing happens async in background

### Issue: OpenAI API errors

**Solution**:

- Verify `OPENAI_API_KEY` is valid and not expired
- Check OpenAI account has credits/quota available
- Review rate limits (adjust MCP_AI_MODEL if needed)
- Check network connectivity to OpenAI API

## Security Considerations

1. **Input Validation**: All parameters validated before execution
2. **Command Whitelist**: Only registered commands can be executed
3. **API Key Protection**: Never expose OpenAI API key to clients
4. **Error Sanitization**: Errors don't leak sensitive information
5. **Rate Limiting**: Consider implementing per-user limits

## Cost Optimization

- **Token Efficiency**: Compressed command registry (~2K tokens)
- **Model Selection**: GPT-5-nano provides excellent cost/performance balance
- **Temperature**: 0.3 for routing (consistent results with fewer tokens)
- **Direct API**: No MCP overhead, faster and more efficient
- **Response Limits**: Concise JSON responses (~200-300 tokens)

## Technical Implementation Notes

### Why No MCP?

The initial implementation used MCP (Model Context Protocol), but it was replaced with direct OpenAI API calls because:

1. **Performance**: Direct API calls are 2-3x faster
2. **Simplicity**: No server process management needed
3. **Reliability**: No connection/timeout issues
4. **LINE Compatibility**: Fire-and-forget pattern prevents webhook timeout
5. **Debugging**: Easier to debug direct API calls

### Fire-and-Forget Pattern

```typescript
// Return immediately to LINE (must respond within 3 seconds)
lineService.handleEvent(compatibleReq, compatibleRes).catch((error) => {
  console.error("❌ Error processing LINE event:", error);
});

return Response.json({ message: "ok" }, { status: 200 });
```

This pattern allows:

- ✅ Instant webhook response to LINE (<100ms)
- ✅ AI processing in background (1-4 seconds)
- ✅ No timeout errors
- ✅ User receives response when ready

---

**Version**: 3.0.0 (Direct OpenAI Integration)  
**Last Updated**: 2025-01-05  
**Branch**: `feature/ai-mcp-integration`  
**Related Docs**:

- [Command Registry](../src/features/line/commands/command-registry.ts)
- [AI Command Router](../src/features/line/commands/ai-command-router.ts)
- [OpenAI Client](../src/lib/ai/openai-client.ts)
- [AI Command Handler](../src/features/line/commands/handleAiCommand.ts)
