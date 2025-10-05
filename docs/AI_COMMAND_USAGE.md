# AI Assistant Command Usage Guide

## Overview

The `/ai` command integrates AI-powered chat capabilities into the LINE bot using **MCP (Model Context Protocol)**. This feature runs a local MCP server within the application, eliminating the need for external MCP server URLs.

## Architecture

```
LINE User → LINE Bot → AI Command Handler → MCP Client → MCP Server (Local) → OpenAI API
```

- **MCP Server**: Runs locally via `stdio` transport in the same process
- **MCP Client**: Connects to the local server using child process spawning
- **AI Provider**: OpenAI GPT-4o via `ai` SDK
- **Conversation Memory**: Maintains context per LINE user ID

## Command Syntax

### 1. Single Question Mode

Ask a one-time question without conversation context.

```
/ai [คำถาม]
```

**Examples:**

```
/ai อธิบาย blockchain คืออะไร
/ai What is quantum computing?
/ai สูตรคำนวณดอกเบี้ยทบต้น
```

**Thai Aliases:**

- `/ถาม [คำถาม]`
- `/ask [คำถาม]`

### 2. Chat Mode (Conversation)

Have a conversation with context retention.

```
/ai chat [ข้อความ]
/ai คุย [ข้อความ]
```

**Examples:**

```
/ai chat สวัสดี ฉันชื่อจอห์น
/ai คุย วันนี้อากาศเป็นอย่างไร
/ai chat ช่วยแนะนำหนังสือเกี่ยวกับ AI หน่อย
```

**Thai Aliases:**

- `/คุย [ข้อความ]`
- `/chat [ข้อความ]`

### 3. Help Command

Display help information.

```
/ai help
/ai ช่วยเหลือ
```

## Features

### ✨ Key Capabilities

1. **Conversation Context**

   - Chat mode maintains conversation history per user
   - Keeps last 20 messages (10 exchanges)
   - Automatic context cleanup to prevent overflow

2. **Model Selection**

   - Default: GPT-4o (optimized for performance)
   - Configurable via `MCP_AI_MODEL` environment variable
   - Options: `gpt-4o`, `gpt-4-turbo`, `gpt-3.5-turbo`

3. **Bilingual Support**

   - Fully supports Thai and English
   - Thai-optimized system prompts in chat mode
   - Smart language detection

4. **Loading Indicators**
   - Single question: "🤖 กำลังประมวลผล..."
   - Chat mode: "💬 กำลังคิด..."

## Configuration

### Environment Variables

Add to your `.env` file:

```env
# Required
OPENAI_API_KEY=sk-your-openai-api-key

# Optional (defaults to gpt-4o)
MCP_AI_MODEL=gpt-4o
```

### VS Code MCP Configuration

The `.vscode/mcp.json` includes the AI assistant server:

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

### File Structure

```
src/
├── lib/
│   └── mcp/
│       ├── server.ts       # MCP server implementation
│       └── client.ts       # MCP client wrapper
└── features/
    └── line/
        └── commands/
            └── handleAiCommand.ts  # LINE command handler
```

### MCP Tools

The server exposes two tools:

1. **`ask_ai`** - Single question answering

   - Input: `question`, `context`, `model`
   - Output: Text response
   - Max tokens: 1000

2. **`chat`** - Conversational AI
   - Input: `message`, `conversationId`, `systemPrompt`
   - Output: Text response with conversation continuity
   - Max tokens: 1000

### Error Handling

- Network errors: Graceful fallback with user-friendly messages
- API errors: Detailed error messages (sanitized for security)
- Timeout handling: Automatic retry mechanism
- Connection cleanup: Proper resource management

## Usage Examples

### Example 1: Quick Question

```
User: /ai อธิบาย NFT
Bot:  🤖 กำลังประมวลผล...
Bot:  🤖 คำตอบ:

NFT (Non-Fungible Token) คือโทเค็นดิจิทัลที่ไม่สามารถแลกเปลี่ยนได้...
```

### Example 2: Conversation Flow

```
User: /ai chat สวัสดี
Bot:  💬 กำลังคิด...
Bot:  💬 สวัสดีครับ! มีอะไรให้ผมช่วยไหมครับ

User: /ai chat ช่วยแนะนำภาษาโปรแกรมสำหรับมือใหม่
Bot:  💬 กำลังคิด...
Bot:  💬 สำหรับผู้เริ่มต้น ผมแนะนำ Python เพราะ...

User: /ai chat มีคอร์สเรียนแนะนำไหม
Bot:  💬 กำลังคิด...
Bot:  💬 มีหลายคอร์สที่ดีสำหรับเรียน Python เช่น...
```

### Example 3: Help Command

```
User: /ai help
Bot:  🤖 คำสั่ง AI Assistant

📌 วิธีใช้งาน:

1️⃣ ถามคำถามเดี่ยว:
   /ai [คำถาม]
   ...
```

## Best Practices

### For Users

1. **Be Specific**: More context = better answers
2. **Use Chat Mode**: For multi-turn conversations
3. **Language Consistency**: Stick to one language per conversation
4. **Keep It Concise**: Questions under 200 words work best

### For Developers

1. **Connection Management**: Use singleton pattern for MCP client
2. **Resource Cleanup**: Always disconnect on application shutdown
3. **Error Logging**: Log errors for debugging without exposing to users
4. **Rate Limiting**: Consider implementing rate limits for API costs
5. **Context Management**: Monitor conversation history size

## Troubleshooting

### Common Issues

**Issue**: "Failed to connect to MCP server"

- **Solution**: Check if `OPENAI_API_KEY` is set
- **Solution**: Verify Bun runtime is available

**Issue**: "Unknown error" in responses

- **Solution**: Check OpenAI API key validity
- **Solution**: Verify internet connectivity
- **Solution**: Check OpenAI API status

**Issue**: Conversation context not maintained

- **Solution**: Ensure using `/ai chat` command (not `/ai`)
- **Solution**: Check if `userId` is being passed correctly

**Issue**: Slow responses

- **Solution**: Consider switching to `gpt-3.5-turbo` for faster responses
- **Solution**: Check network latency to OpenAI API

## Security Considerations

1. **API Key Protection**: Never expose `OPENAI_API_KEY` to clients
2. **Input Validation**: All user inputs are validated before processing
3. **Error Sanitization**: Error messages don't leak sensitive information
4. **Rate Limiting**: Consider implementing per-user rate limits
5. **Cost Management**: Monitor OpenAI API usage and set budget alerts

## Cost Optimization

- **Token Limits**: Max 1000 tokens per response
- **History Pruning**: Keeps only last 20 messages
- **Model Selection**: Default to GPT-4o (balanced cost/performance)
- **Caching**: Consider caching common questions (future enhancement)

## Future Enhancements

- [ ] Streaming responses for real-time feedback
- [ ] Multi-modal support (images, documents)
- [ ] Custom system prompts per user
- [ ] Response caching for common questions
- [ ] Analytics dashboard for usage tracking
- [ ] Fine-tuned models for domain-specific knowledge

## Support

For issues or questions:

1. Check this documentation
2. Review error logs in application console
3. Verify environment configuration
4. Contact development team

---

**Version**: 1.0.0  
**Last Updated**: 2025-01-05  
**Branch**: `feature/ai-mcp-integration`
