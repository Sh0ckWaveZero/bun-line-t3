import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

export interface AIResponse {
  text: string;
  conversationId?: string;
}

export interface AskAIParams {
  question: string;
  context?: string;
  model?: "gpt-4o" | "gpt-4-turbo" | "gpt-3.5-turbo";
}

export interface ChatParams {
  message: string;
  conversationId?: string;
  systemPrompt?: string;
}

export interface RouteCommandParams {
  userMessage: string;
  availableCommands: string;
}

export interface CommandRouteResponse {
  command: string | null;
  parameters: Record<string, any>;
  reasoning: string;
  confidence: number;
}

/**
 * MCP Client for AI interactions
 * Connects to the local MCP server running in the same process
 */
export class AIMCPClient {
  private client: Client | null = null;
  private transport: StdioClientTransport | null = null;
  private isConnected = false;

  /**
   * Initialize and connect to the MCP server
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    try {
      this.client = new Client(
        {
          name: "ai-line-bot-client",
          version: "1.0.0",
        },
        {
          capabilities: {},
        },
      );

      // Start the MCP server as a child process
      this.transport = new StdioClientTransport({
        command: "bun",
        args: ["src/lib/mcp/server.ts"],
      });

      await this.client.connect(this.transport);
      this.isConnected = true;
      console.log("✅ MCP Client connected to AI server");
    } catch (error) {
      console.error("❌ Failed to connect to MCP server:", error);
      throw error;
    }
  }

  /**
   * Disconnect from the MCP server
   */
  async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      if (this.client) {
        await this.client.close();
      }
      this.isConnected = false;
      console.log("✅ MCP Client disconnected");
    } catch (error) {
      console.error("❌ Error disconnecting from MCP server:", error);
    }
  }

  /**
   * Ask a single question to AI
   */
  async askAI(params: AskAIParams): Promise<AIResponse> {
    if (!this.isConnected || !this.client) {
      await this.connect();
    }

    try {
      const result = await this.client!.callTool({
        name: "ask_ai",
        arguments: {
          question: params.question,
          context: params.context,
          model: params.model || "gpt-4o",
        },
      });

      if (result.isError) {
        throw new Error(
          result.content[0]?.type === "text"
            ? result.content[0].text
            : "Unknown error",
        );
      }

      const text =
        result.content[0]?.type === "text" ? result.content[0].text : "";

      return { text };
    } catch (error) {
      console.error("❌ Error calling ask_ai tool:", error);
      throw error;
    }
  }

  /**
   * Have a conversation with AI (maintains context)
   */
  async chat(params: ChatParams): Promise<AIResponse> {
    if (!this.isConnected || !this.client) {
      await this.connect();
    }

    try {
      const result = await this.client!.callTool({
        name: "chat",
        arguments: {
          message: params.message,
          conversationId: params.conversationId,
          systemPrompt: params.systemPrompt,
        },
      });

      if (result.isError) {
        throw new Error(
          result.content[0]?.type === "text"
            ? result.content[0].text
            : "Unknown error",
        );
      }

      const text =
        result.content[0]?.type === "text" ? result.content[0].text : "";

      return {
        text,
        conversationId: params.conversationId,
      };
    } catch (error) {
      console.error("❌ Error calling chat tool:", error);
      throw error;
    }
  }

  /**
   * Route natural language command to LINE bot command
   */
  async routeCommand(
    params: RouteCommandParams,
  ): Promise<CommandRouteResponse> {
    if (!this.isConnected || !this.client) {
      await this.connect();
    }

    try {
      const result = await this.client!.callTool({
        name: "route_command",
        arguments: {
          userMessage: params.userMessage,
          availableCommands: params.availableCommands,
        },
      });

      if (result.isError) {
        throw new Error(
          result.content[0]?.type === "text"
            ? result.content[0].text
            : "Unknown error",
        );
      }

      const text =
        result.content[0]?.type === "text" ? result.content[0].text : "";

      // Parse JSON response
      try {
        const parsed = JSON.parse(text);
        return {
          command: parsed.command || null,
          parameters: parsed.parameters || {},
          reasoning: parsed.reasoning || "",
          confidence: parsed.confidence || 0,
        };
      } catch (parseError) {
        console.error("❌ Failed to parse AI response:", text);
        throw new Error("Failed to parse AI command routing response");
      }
    } catch (error) {
      console.error("❌ Error calling route_command tool:", error);
      throw error;
    }
  }

  /**
   * List available tools from the MCP server
   */
  async listTools(): Promise<any> {
    if (!this.isConnected || !this.client) {
      await this.connect();
    }

    try {
      const result = await this.client!.listTools();
      return result.tools;
    } catch (error) {
      console.error("❌ Error listing tools:", error);
      throw error;
    }
  }
}

// Singleton instance
let clientInstance: AIMCPClient | null = null;

/**
 * Get or create the MCP client instance
 */
export function getAIMCPClient(): AIMCPClient {
  if (!clientInstance) {
    clientInstance = new AIMCPClient();
  }
  return clientInstance;
}

/**
 * Cleanup function to disconnect the client
 */
export async function cleanupMCPClient(): Promise<void> {
  if (clientInstance) {
    await clientInstance.disconnect();
    clientInstance = null;
  }
}
