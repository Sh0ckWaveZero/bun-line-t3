import { routeCommand, type CommandRouteResponse } from "./openai-client";
import { buildAvailableCommandsContext } from "./command-context";
import type { CommandDefinition } from "@/features/line/commands/command-registry";

/**
 * Route natural language to appropriate LINE command using AI
 *
 * @param naturalLanguage - User's natural language input
 * @param commands - Available command definitions
 * @returns AI response with command, parameters, and confidence
 */
export async function routeNaturalLanguageToCommand(
  naturalLanguage: string,
  commands: CommandDefinition[],
): Promise<string> {
  const availableCommands = buildAvailableCommandsContext(commands);

  // Call OpenAI to route command
  const response: CommandRouteResponse = await routeCommand({
    userMessage: naturalLanguage,
    availableCommands,
    allowedCommands: commands.map((cmd) => cmd.command),
  });

  // Convert to string format expected by parseAICommandResponse
  return JSON.stringify({
    command: response.command,
    parameters: response.parameters,
    confidence: response.confidence,
  });
}
