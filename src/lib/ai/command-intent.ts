import { routeCommand, type CommandRouteResponse } from "./openai-client";
import type { CommandDefinition } from "@/features/line/commands/command-registry";

/**
 * Route natural language to appropriate LINE command using AI
 *
 * @param naturalLanguage - User's natural language input
 * @param commands - Available command definitions
 * @returns AI response with command, parameters, and reasoning
 */
export async function routeNaturalLanguageToCommand(
  naturalLanguage: string,
  commands: CommandDefinition[],
): Promise<string> {
  // Format commands for AI
  const availableCommands = commands
    .map((cmd) => {
      const aliases = cmd.aliases.join(", ");
      return `- ${cmd.command} (${aliases}): ${cmd.descriptionTH}`;
    })
    .join("\n");

  // Call OpenAI to route command
  const response: CommandRouteResponse = await routeCommand({
    userMessage: naturalLanguage,
    availableCommands,
  });

  // Convert to string format expected by parseAICommandResponse
  return JSON.stringify({
    command: response.command,
    parameters: response.parameters,
    reasoning: response.reasoning,
  });
}
