# AI Command Routing - Natural Language Interface

## Overview

The `/ai` command provides an **intelligent natural language interface** for the LINE bot using **MCP (Model Context Protocol)**. Instead of memorizing specific commands, users can simply describe what they want in Thai or English.

## Architecture

```
LINE User
    ↓ Natural Language: "ดึงราคาทองให้หน่อย"
AI Command Router (MCP)
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

2. **MCP Server** (`src/lib/mcp/server.ts`)

   - `route_command` tool: Analyzes natural language and returns JSON
   - Runs locally via stdio (no external server needed)
   - Uses configurable AI model (default: MCP_AI_MODEL env variable)
   - Supports any OpenAI model: gpt-4o, gpt-5-nano, gpt-4-turbo, etc.

3. **MCP Client** (`src/lib/mcp/client.ts`)

   - `routeCommand()` method: Sends request to MCP server
   - Parses JSON response with command and parameters
   - Singleton pattern for connection management

4. **AI Command Router** (`ai-command-router.ts`)

   - `executeCommand()`: Routes to appropriate handler
   - Handles all command categories (crypto, work, info, etc.)
   - Returns success/error status with explanations

5. **AI Command Handler** (`handleAiCommand.ts`)
   - Entry point for `/ai` commands
   - Orchestrates routing flow
   - Provides user feedback at each step

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

2. **Loading Indicator**

   ```
   Bot: 🤖 กำลังวิเคราะห์คำขอ...
   ```

3. **AI Analysis** (via MCP)

   ```json
   {
     "command": "gold",
     "parameters": {},
     "reasoning": "ผู้ใช้ต้องการทราบราคาทอง",
     "confidence": 1.0
   }
   ```

4. **Confirmation**

   ```
   Bot: ✅ เข้าใจแล้ว: ผู้ใช้ต้องการทราบราคาทอง
        ⚡ กำลังดำเนินการ...
   ```

5. **Command Execution**

   ```
   Executes: handleGoldCommand(req)
   ```

6. **Response**
   ```
   Bot: [Gold prices display]
   ```

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
# Required
OPENAI_API_KEY=sk-your-openai-api-key

# AI Model Configuration
# Supports any OpenAI model: gpt-4o, gpt-5-nano, gpt-4-turbo, gpt-3.5-turbo, etc.
# Default: gpt-4o (if not specified)
MCP_AI_MODEL=gpt-5-nano
```

### MCP Server Configuration

`.vscode/mcp.json`:

```json
{
  "servers": {
    "ai-assistant": {
      "command": "bun",
      "args": ["src/lib/mcp/server.ts"],
      "env": {
        "OPENAI_API_KEY": "${OPENAI_API_KEY}"
      }
    }
  }
}
```

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

The MCP server uses a structured prompt that:

- Provides complete command registry
- Explains parameter extraction
- Shows example mappings
- Requests JSON response format

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

### Unit Tests

```bash
bun test tests/ai-command-routing.test.ts
```

Test coverage:

- Command registry formatting
- Natural language routing (Thai/English)
- Parameter extraction
- Multi-language support
- Confidence scoring
- Error handling

### Manual Testing Examples

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
```

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

### MCP Connection Error

```
Bot: ขอโทษครับ เกิดข้อผิดพลาดในการประมวลผล
     Error: [sanitized error]
     กรุณาลองใหม่อีกครั้ง
```

## Performance

- **Average Response Time**: 2-4 seconds
- **AI Routing**: ~1-2 seconds
- **Command Execution**: ~1-2 seconds (varies by command)
- **Token Usage**: ~300-500 tokens per routing request

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

### Issue: MCP connection fails

**Solution**:

- Verify `OPENAI_API_KEY` is set
- Check Bun runtime availability
- Review MCP server logs

## Security Considerations

1. **Input Validation**: All parameters validated before execution
2. **Command Whitelist**: Only registered commands can be executed
3. **API Key Protection**: Never expose OpenAI API key to clients
4. **Error Sanitization**: Errors don't leak sensitive information
5. **Rate Limiting**: Consider implementing per-user limits

## Cost Optimization

- **Token Efficiency**: Compressed command registry (~2K tokens)
- **Caching**: Consider caching common routing patterns
- **Model Selection**: GPT-4o balances cost/performance
- **Response Limits**: Max 500 tokens per routing response

---

**Version**: 2.0.0 (Natural Language Routing)  
**Last Updated**: 2025-01-05  
**Branch**: `feature/ai-mcp-integration`  
**Related Docs**:

- [Command Registry](../src/features/line/commands/command-registry.ts)
- [AI Command Router](../src/features/line/commands/ai-command-router.ts)
- [MCP Server](../src/lib/mcp/server.ts)
